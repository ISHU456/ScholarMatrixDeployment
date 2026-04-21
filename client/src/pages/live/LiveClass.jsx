import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { 
  ArrowLeft, Loader2, ShieldCheck, Video, VideoOff, Mic, MicOff, 
  MessageSquare, Send, Hand, Users, Sparkles, Monitor, Maximize, 
  Settings, X, PhoneOff, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-api.onrender.com';

const LiveClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'hod';

  const [isLoading, setIsLoading] = useState(true);
  const [stream, setStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const [handsRaisedList, setHandsRaisedList] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [members, setMembers] = useState([]); // List of { name, role, _id }
  const [activeTab, setActiveTab] = useState('chat'); // chat | members
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const socketRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const streamRef = useRef(); // Use Ref for stream to avoid closure issues
  const peerConnections = useRef({}); // Object to store all RTC connections
  const pendingCandidates = useRef({}); // Queue for ICE candidates before description is set
  const chatEndRef = useRef();

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    socketRef.current = io(API_URL);
    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsLoading(false);
      socket.emit('join-room', classId, { _id: user?._id, name: user?.name, role: user?.role });
      
      if (isTeacher) {
        startBroadcasting();
      } else {
        socket.emit('join-broadcast', classId);
      }
    });

    socket.on('update-members', (memberList) => {
      setMembers(memberList);
      setViewerCount(memberList.length);
    });

    // Chat Logic
    socket.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg].slice(-100));
    });

    socket.on('student-raised-hand', (userData) => {
      setHandsRaisedList(prev => [...prev, userData]);
      // Remove after 10 seconds automatically
      setTimeout(() => {
        setHandsRaisedList(prev => prev.filter(u => u._id !== userData._id));
      }, 10000);
    });

    // WebRTC Signaling
    socket.on('new-viewer', async (viewerId) => {
      if (!isTeacher) return;
      createPeerConnection(viewerId, true);
    });

    socket.on('offer', async (senderId, offer) => {
      if (isTeacher) return; // Teachers don't receive offers in this broadcast model
      await handleOffer(senderId, offer);
    });

    socket.on('answer', async (senderId, answer) => {
      await handleAnswer(senderId, answer);
    });

    socket.on('ice-candidate', async (senderId, candidate) => {
      await handleIceCandidate(senderId, candidate);
    });

    // Viewers count
    socket.on('user-connected', () => setViewerCount(prev => prev + 1));
    socket.on('user-disconnected', () => setViewerCount(prev => Math.max(0, prev - 1)));

    return () => {
      socket.disconnect();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [classId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startBroadcasting = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      streamRef.current = localStream;
      setStream(localStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      socketRef.current.emit('start-broadcast', classId);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not access camera/microphone.");
    }
  };

  const createPeerConnection = async (viewerId, isOffer) => {
    if (peerConnections.current[viewerId]) {
      peerConnections.current[viewerId].close();
    }

    const pc = new RTCPeerConnection(iceServers);
    peerConnections.current[viewerId] = pc;

    const currentStream = streamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach(track => pc.addTrack(track, currentStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', viewerId, event.candidate);
      }
    };

    if (isOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('offer', viewerId, offer);
    }
    
    return pc;
  };

  const processQueuedCandidates = async (id, pc) => {
    const queue = pendingCandidates.current[id];
    if (queue) {
      while (queue.length) {
        const cand = queue.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) { console.error("Error adding queued candidate", e); }
      }
    }
  };

  const handleOffer = async (senderId, offer) => {
    if (peerConnections.current[senderId]) {
      peerConnections.current[senderId].close();
    }

    const pc = new RTCPeerConnection(iceServers);
    peerConnections.current[senderId] = pc;

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', senderId, event.candidate);
      }
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('answer', senderId, answer);
      
      // Process any candidates that arrived early
      await processQueuedCandidates(senderId, pc);
    } catch (e) {
      console.error("Failed to handle offer", e);
    }
  };

  const handleAnswer = async (senderId, answer) => {
    const pc = peerConnections.current[senderId];
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await processQueuedCandidates(senderId, pc);
      } catch (e) { console.error("Error setting answer", e); }
    }
  };

  const handleIceCandidate = async (senderId, candidate) => {
    const pc = peerConnections.current[senderId];
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) { console.error("Error adding candidate", e); }
    } else {
      if (!pendingCandidates.current[senderId]) pendingCandidates.current[senderId] = [];
      pendingCandidates.current[senderId].push(candidate);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = {
      text: newMessage,
      sender: user.name,
      senderRole: user.role,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: Date.now()
    };
    socketRef.current.emit('send-message', classId, msg);
    setNewMessage('');
  };

  const toggleHand = () => {
    if (!handRaised) {
      socketRef.current.emit('raise-hand', classId, { _id: user._id, name: user.name });
    }
    setHandRaised(!handRaised);
    setTimeout(() => setHandRaised(false), 5000);
  };

  const handleLeave = () => {
    navigate(-1);
  };

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="h-screen w-full bg-[#030712] text-white flex flex-col lg:flex-row overflow-hidden font-sans">
      
      {/* --- Main Stream Section --- */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-black">
        {/* Header Overlay */}
        <div className="absolute top-0 inset-x-0 p-6 z-30 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <button onClick={handleLeave} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all backdrop-blur-md">
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 bg-rose-600 rounded text-[10px] font-bold uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.5)]">
                  LIVE
                </div>
                <h1 className="text-sm font-bold uppercase tracking-tighter truncate max-w-[200px]">
                  {classId} Stream
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Users size={12} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{viewerCount} Watching Now</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto">
             <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold tracking-widest uppercase truncate max-w-[150px]">{user.name}</span>
             </div>
          </div>
        </div>

        {/* Video Surface */}
        <div className="flex-1 w-full h-full relative group">
           {isTeacher ? (
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                 muted
                className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : 'block'}`}
              />
           ) : (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain"
              />
           )}
           
           {(isTeacher && isVideoMuted) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-2xl">
                 <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border border-white/20 mb-4">
                    <VideoOff size={40} className="text-gray-400" />
                 </div>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Camera Signal Disabled</p>
              </div>
           )}

           {isLoading && !stream && !isTeacher && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950">
                 <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
                 <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Establishing WebRTC Handshake...</p>
              </div>
           )}

           {/* Floating Hand Alerts (Teacher Only) */}
           <div className="absolute bottom-32 left-8 z-[40] flex flex-col gap-3">
              <AnimatePresence>
                {handsRaisedList.map((st, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -50, scale: 0.5 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="px-6 py-3 bg-primary-600 text-white rounded-3xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-xl"
                  >
                    <Hand size={18} fill="white" className="animate-bounce" />
                    <span className="text-xs font-bold uppercase tracking-wide">{st.name} raised hand!</span>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>

        {/* Control Bar Overlay */}
        <div className="absolute bottom-8 inset-x-0 flex justify-center z-[50] pointer-events-none">
           <div className="flex items-center gap-4 p-2 bg-[#1f2937]/60 backdrop-blur-2xl rounded-full border border-white/10 pointer-events-auto shadow-3xl">
              {isTeacher && (
                 <>
                   <button 
                     onClick={toggleVideo} 
                     className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoMuted ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                   >
                     {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
                   </button>
                   <button 
                     onClick={toggleMute} 
                     className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isAudioMuted ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                   >
                     {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
                   </button>
                   <div className="w-px h-8 bg-white/10 mx-2" />
                 </>
              )}
              
              {!isTeacher && (
                 <button 
                   onClick={toggleHand} 
                   className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${handRaised ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                 >
                   <Hand size={20} fill={handRaised ? 'white' : 'none'} />
                 </button>
              )}

              <button 
                 onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                 className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSidebarVisible ? 'bg-primary-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-white/10 hover:bg-white/20'}`}
                 title={isSidebarVisible ? "Enter Full Mode" : "Open Interactions"}
               >
                 <MessageSquare size={20} />
               </button>

               <div className="w-px h-8 bg-white/10 mx-2" />

               <button 
                 onClick={handleLeave} 
                 className="px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-3"
               >
                 <PhoneOff size={16} /> END SESSION
               </button>
           </div>
        </div>
      </div>

      {/* --- Sidebar (Chat & Interactions) --- */}
      <AnimatePresence>
        {isSidebarVisible && (
          <motion.div 
            initial={{ x: 450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 450, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full lg:w-[450px] shrink-0 bg-[#0b0f19] border-l border-gray-800 flex flex-col relative z-20 overflow-hidden"
          >
            <header className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#0d111c]/80 backdrop-blur-xl">
               <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-primary-500" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-300">Class interaction hub</h2>
               </div>
               <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-800">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === 'chat' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Chat
                  </button>
                  <button 
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === 'members' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Members
                  </button>
               </div>
               <button onClick={() => setIsSidebarVisible(false)} className="lg:hidden p-2 text-gray-400 hover:text-white">
                  <X size={20} />
               </button>
            </header>

            {activeTab === 'chat' ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-20">
                       <Sparkles size={48} className="mb-4" />
                       <p className="text-xs font-bold uppercase tracking-widest">Protocol initiated.<br/>Waiting for session discourse.</p>
                    </div>
                  )}
                  
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex flex-col ${msg.sender === user.name ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-bold text-gray-500 uppercase">{msg.sender}</span>
                           <span className="text-[8px] font-bold text-gray-700">{msg.time}</span>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-xs font-medium max-w-[85%] leading-relaxed ${msg.sender === user.name ? 'bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-900/20' : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'}`}>
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-6 bg-[#0d111c] border-t border-gray-800 flex items-center gap-4">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Submit observation..." 
                    className="flex-1 h-12 bg-gray-900/50 border border-gray-800 rounded-2xl px-5 text-sm outline-none focus:border-primary-500 transition-all font-medium"
                  />
                  <button 
                    type="submit"
                    className="w-12 h-12 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
          <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
             <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Registry</p>
                <div className="px-2 py-1 bg-emerald-500/10 rounded-lg text-[9px] font-bold text-emerald-500">{members.length} ONLINE</div>
             </div>
             
             {members.map((member, i) => (
               <motion.div 
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 key={member.socketId || i} 
                 className="flex items-center justify-between p-4 bg-gray-900/30 border border-gray-800 rounded-2xl group hover:border-primary-500/30 transition-all"
               >
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs ${member.role === 'teacher' ? 'bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'bg-primary-600'}`}>
                        {member.name?.substring(0, 2).toUpperCase()}
                     </div>
                     <div>
                        <p className="text-xs font-bold uppercase tracking-tight text-gray-200 group-hover:text-white transition-colors">{member.name}</p>
                        <p className={`text-[9px] font-bold uppercase ${member.role === 'teacher' ? 'text-rose-500' : 'text-primary-400'}`}>
                           {member.role === 'teacher' ? 'Faculty Lead' : 'Scholastic Terminal'}
                        </p>
                     </div>
                  </div>
                  {member.role === 'teacher' && <Radio size={14} className="text-rose-500 animate-pulse" />}
               </motion.div>
             ))}
          </div>
        )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LiveClass;
