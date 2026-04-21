import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, QrCode, ScanLine, Search, ChevronRight, BookOpen, MessageSquare, Briefcase } from 'lucide-react';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'motion/react';

const SPACE_TYPES = [
  { id: 'Classroom', icon: BookOpen, label: 'Classroom', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
  { id: 'Club', icon: Users, label: 'Club', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
  { id: 'Forum', icon: MessageSquare, label: 'Forum', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
  { id: 'Project', icon: Briefcase, label: 'Project', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' }
];

export default function Classrooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState('Classroom');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const tabs = ['code', 'scan', 'create'] as const;
  type TabType = typeof tabs[number];
  const [activeTab, setActiveTab] = useState<TabType>('code');
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'classrooms'), where('members', 'array-contains', user.uid));
    const unSub = onSnapshot(q, snap => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setClassrooms(data);
    });
    return () => unSub();
  }, [user]);

  const handleCreate = async () => {
    if (!createName.trim() || !user) return;
    const ref = await addDoc(collection(db, 'classrooms'), {
      name: createName,
      type: createType,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      ownerId: user.uid,
      members: [user.uid]
    });
    setCreateName('');
    navigate(`/classroom/${ref.id}`);
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !user) return;
    const q = query(collection(db, 'classrooms'), where('code', '==', joinCode.toUpperCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const classDoc = snap.docs[0];
      await updateDoc(doc(db, 'classrooms', classDoc.id), {
        members: arrayUnion(user.uid)
      });
      setJoinCode('');
      navigate(`/classroom/${classDoc.id}`);
    } else {
      alert("Space not found. Please check code.");
    }
  };

  const handleScanQr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          setJoinCode(code.data);
          alert(`Successfully scanned code: ${code.data} - Tap Join!`);
        } else {
          alert("No valid QR code found in photo. Please ensure it's clear and try again.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const switchTab = (tab: TabType) => {
    const currentIdx = tabs.indexOf(activeTab);
    const newIdx = tabs.indexOf(tab);
    setDirection(newIdx > currentIdx ? 1 : -1);
    setActiveTab(tab);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 20 : -20, opacity: 0 })
  };

  return (
    <div className="min-h-full bg-[var(--color-brand-bg-primary)] pt-16 px-4">
      {/* Header */}
      <div className="fixed top-0 inset-x-0 h-16 bg-[#0F0F0F]/80 backdrop-blur-3xl z-40 flex items-center px-6 border-b border-white/5">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Spaces</h1>
      </div>

      <div className="pt-4 space-y-8 pb-32">
        {/* Action Panel Tab Control */}
        <div>
          <div className="flex bg-[#12121D] p-1.5 rounded-2xl mb-4 border border-white/5 shadow-inner relative">
            {tabs.map((tab) => (
              <button 
                key={tab}
                onClick={() => switchTab(tab)}
                className={`flex-1 py-2.5 text-[15px] font-medium rounded-xl transition-all relative z-10 ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {tab === 'code' ? 'Join Code' : tab === 'scan' ? 'Scan QR' : 'Create'}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-[#2A2A4A] rounded-xl shadow-md z-[-1]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="bg-[#1A1A2E] rounded-[28px] p-6 border border-white/5 shadow-xl relative overflow-hidden min-h-[260px]">
             {/* Subtle Glow */}
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--color-brand-accent-purple)]/20 blur-3xl rounded-full pointer-events-none"></div>

             <AnimatePresence mode="wait" custom={direction}>
               {activeTab === 'code' && (
                 <motion.div key="code" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 350, damping: 30, duration: 0.2 }}>
                   <h2 className="text-white text-xl font-semibold mb-1">Enter Code</h2>
                   <p className="text-gray-400 text-sm mb-5">Ask your admin for the 6-digit space code.</p>
                   <div className="flex flex-col gap-3">
                     <input 
                       type="text" 
                       maxLength={6}
                       placeholder="000000" 
                       value={joinCode}
                       onChange={e => setJoinCode(e.target.value.toUpperCase())}
                       className="w-full bg-[#0F0F0F] rounded-2xl px-6 py-4 text-3xl text-center text-white outline-none uppercase font-mono tracking-[0.4em] focus:ring-2 ring-[var(--color-brand-accent-purple)] transition-all border border-white/5"
                     />
                     <button onClick={handleJoin} disabled={joinCode.length < 6} className="w-full mt-2 bg-white text-black py-3.5 rounded-xl font-bold shadow-lg disabled:opacity-50 active:scale-[0.98] transition-transform">
                       Join Space
                     </button>
                   </div>
                 </motion.div>
               )}

               {activeTab === 'scan' && (
                 <motion.div key="scan" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 350, damping: 30, duration: 0.2 }} className="flex flex-col items-center py-2">
                   <div className="w-20 h-20 bg-[#0F0F0F] rounded-3xl flex items-center justify-center mb-5 border border-white/5 shadow-inner">
                      <QrCode size={36} className="text-[var(--color-brand-accent-cyan)] opacity-90" />
                   </div>
                   <h2 className="text-white text-xl font-semibold mb-1">Scan QR Code</h2>
                   <p className="text-gray-400 text-sm mb-6 text-center max-w-[260px]">Point your camera at a space's code to join instantly.</p>
                   
                   <button onClick={() => fileInputRef.current?.click()} className="w-full bg-[#0F0F0F] text-white py-3.5 rounded-xl font-semibold border border-white/10 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center hover:bg-white/5">
                     <ScanLine className="mr-2 opacity-80" size={20} /> Open Camera
                   </button>
                   <input type="file" ref={fileInputRef} onChange={handleScanQr} accept="image/*" capture="environment" className="hidden" />
                 </motion.div>
               )}

               {activeTab === 'create' && (
                 <motion.div key="create" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 350, damping: 30, duration: 0.2 }}>
                   <div className="mb-4">
                     <h2 className="text-white text-xl font-semibold mb-1">Create Space</h2>
                     <p className="text-gray-400 text-sm">Select the type of environment you need.</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 mb-5">
                     {SPACE_TYPES.map(type => {
                       const Icon = type.icon;
                       const isActive = createType === type.id;
                       return (
                         <motion.button 
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.95 }}
                           key={type.id} 
                           onClick={() => setCreateType(type.id)}
                           className={`p-3.5 rounded-[20px] border flex flex-col items-start gap-2.5 transition-colors duration-300 text-left relative overflow-hidden ${isActive ? `${type.bg} ${type.border} ${type.color}` : 'bg-[#0F0F0F] border-white/5 text-gray-400 hover:bg-white/5'}`}
                         >
                           {isActive && <motion.div layoutId="typeIndicator" className="absolute inset-0 bg-white/5 z-0" />}
                           <Icon size={22} className={`relative z-10 ${isActive ? type.color : 'opacity-70'}`} />
                           <span className="font-semibold text-[14px] relative z-10">{type.label}</span>
                         </motion.button>
                       )
                     })}
                   </div>

                   <div className="flex flex-col gap-4">
                     <div className="relative">
                       <input 
                         type="text" 
                         placeholder={`${createType} Name e.g. CS 101`} 
                         value={createName}
                         onChange={e => setCreateName(e.target.value)}
                         className="w-full bg-[#0F0F0F] px-5 py-4 rounded-[18px] text-white outline-none border border-white/10 focus:border-[var(--color-brand-accent-purple)] transition-all duration-300 placeholder:text-gray-600 shadow-inner"
                       />
                     </div>
                     <motion.button 
                       whileHover={createName.trim() ? { scale: 1.02 } : {}}
                       whileTap={createName.trim() ? { scale: 0.96 } : {}}
                       onClick={handleCreate} 
                       disabled={!createName.trim()} 
                       className={`w-full py-4 rounded-[18px] font-bold shadow-lg transition-all duration-300 ${createName.trim() ? 'bg-gradient-to-r from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] text-white' : 'bg-[#0F0F0F] border border-white/10 text-gray-500'}`}
                     >
                       Launch {createType}
                     </motion.button>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* List */}
        <div>
           <div className="flex items-center justify-between mb-4 px-1">
             <h3 className="text-white font-semibold text-xl tracking-tight">Active Spaces</h3>
           </div>
           
           <div className="grid gap-3">
             {classrooms.length === 0 ? (
               <div className="text-center bg-[#1A1A2E] py-12 px-6 rounded-[28px] border border-white/5 text-gray-500 shadow-inner">
                 <div className="mx-auto w-14 h-14 bg-[#0F0F0F] rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                   <Search size={22} className="opacity-50" />
                 </div>
                 <p className="font-medium">You haven't joined any spaces yet.</p>
                 <p className="text-sm mt-1 opacity-70">Use a code or scan a QR to get started.</p>
               </div>
             ) : classrooms.map(c => {
               const typeInfo = SPACE_TYPES.find(t => t.id === c.type) || SPACE_TYPES[0];
               const Icon = typeInfo.icon;

               return (
                 <motion.div 
                   whileTap={{ scale: 0.97 }}
                   key={c.id} 
                   onClick={() => navigate(`/classroom/${c.id}`)} 
                   className="bg-[#1A1A2E] p-4 rounded-[24px] flex items-center justify-between cursor-pointer border border-white/5 shadow-md hover:bg-[#2A2A4A] transition-colors group"
                 >
                   <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center ${typeInfo.bg} ${typeInfo.color} shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] border ${typeInfo.border}`}>
                       <Icon size={24} strokeWidth={2.5} />
                     </div>
                     <div>
                       <h4 className="text-white font-semibold text-[17px] leading-tight mb-0.5">{c.name}</h4>
                       <p className="text-gray-400 text-sm font-medium flex items-center gap-1.5">
                         {c.type || 'Classroom'} <span className="w-1 h-1 rounded-full bg-gray-600"></span> {c.members.length} members
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center text-gray-600 group-hover:text-white transition-colors mr-1">
                      <ChevronRight size={22} strokeWidth={2.5} />
                   </div>
                 </motion.div>
               )
             })}
           </div>
        </div>
      </div>
    </div>
  );
}
