import React, { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, QrCode, MessageSquare, Send, SmilePlus, MessageCircle, ChevronLeft, Bold, Italic, Link2, Code, AtSign, BarChart2, X, Plus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🚀', '👀', '💯'];

const MARKDOWN_COMPONENTS = {
  a: ({node, href, ...props}: any) => {
    if (href?.startsWith('mention:')) {
      return <span className="text-[var(--color-brand-accent-purple)] font-bold bg-[var(--color-brand-accent-purple)]/20 px-1 rounded-md" {...props} />
    }
    return <a href={href} className="text-[var(--color-brand-accent-cyan)] hover:underline break-words" target="_blank" rel="noopener noreferrer" {...props} />
  },
  p: ({node, ...props}: any) => <p className="mb-2 last:mb-0" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
  li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-bold text-white shadow-sm" {...props} />,
  em: ({node, ...props}: any) => <em className="italic opacity-90" {...props} />,
  code: ({node, inline, className, children, ...props}: any) => {
    const match = /language-(\w+)/.exec(className || '')
    return inline ? (
      <code className="bg-black/30 px-1.5 py-0.5 rounded-md text-[13px] font-mono text-[var(--color-brand-accent-purple)]" {...props}>
        {children}
      </code>
    ) : (
      <div className="relative my-3">
        <pre className="bg-[#0A0A10] p-4 rounded-xl overflow-x-auto text-[13px] font-mono text-gray-300 border border-white/5 shadow-inner">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    )
  },
  blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-[var(--color-brand-accent-purple)]/50 pl-4 py-1 text-gray-400 italic my-3 bg-white/5 rounded-r-lg" {...props} />,
  h1: ({node, ...props}: any) => <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-md font-bold text-white mt-2 mb-1" {...props} />,
};

const ForumPost = ({ post, isReply, classroomId, threadId, onReplyClick, depth = 0 }: any) => {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = async (emoji: string) => {
    setShowPicker(false);
    if (!user) return;
    const path = isReply 
      ? `classrooms/${classroomId}/posts/${threadId}/replies/${post.id}` 
      : `classrooms/${classroomId}/posts/${post.id}`;
    
    const reactions = post.reactions || {};
    const usersApplauded = reactions[emoji] || [];
    const hasReacted = usersApplauded.includes(user.uid);

    const ref = doc(db, path);
    try {
      if (hasReacted) {
        await updateDoc(ref, { 
           reactions: { ...reactions, [emoji]: usersApplauded.filter((id: string) => id !== user.uid) } 
        });
      } else {
        await updateDoc(ref, { 
           reactions: { ...reactions, [emoji]: [...usersApplauded, user.uid] } 
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const reactionsEntries = Object.entries(post.reactions || {}).filter(([_, users]: any) => users.length > 0);
  const formattedText = post.text.replace(/(^|\s)@([A-Za-z0-9_]+)/g, '$1[@$2](mention:$2)');

  const handleVote = async (optionIndex: number) => {
    if (!user || !post.poll) return;
    const path = isReply 
      ? `classrooms/${classroomId}/posts/${threadId}/replies/${post.id}` 
      : `classrooms/${classroomId}/posts/${post.id}`;
    
    const updatedOptions = post.poll.options.map((opt: any, idx: number) => {
       const hasVoted = opt.votes.includes(user.uid);
       if (idx === optionIndex) {
          return { ...opt, votes: hasVoted ? opt.votes.filter((id: string) => id !== user.uid) : [...opt.votes, user.uid] };
       } else {
          return { ...opt, votes: opt.votes.filter((id: string) => id !== user.uid) };
       }
    });

    try {
       await updateDoc(doc(db, path), { poll: { ...post.poll, options: updatedOptions } });
    } catch (err) {
       console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${isReply ? 'bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]' : 'bg-[#1A1A2E] p-5 rounded-3xl border border-white/5'} shadow-sm relative overflow-hidden`}>
       {isReply && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--color-brand-accent-purple)]/50 to-transparent opacity-50" />}
       <div className="flex justify-between items-start mb-3">
         <div className="flex items-center">
            {post.authorAvatar ? (
              <img src={post.authorAvatar} alt="avatar" className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border border-white/10 mr-3 object-cover`} />
            ) : (
              <div className={`${isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-[12px] bg-gradient-to-br from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] mr-3 flex items-center justify-center text-white font-bold shadow-inner`}>
                {post.authorName?.substring(0,2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <div className={`text-white font-semibold leading-tight ${isReply ? 'text-[14px]' : 'text-[15px]'}`}>{post.authorName}</div>
                {isReply && post.parentId && (
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md text-gray-400 font-medium">Reply</span>
                )}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-0.5">{post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), {addSuffix:true}) : 'Just now'}</div>
            </div>
         </div>
       </div>
       <div className={`text-slate-200 leading-relaxed break-words markdown-body ${isReply ? 'text-[14px]' : 'text-[15px]'}`}>
         <Markdown components={MARKDOWN_COMPONENTS}>{formattedText}</Markdown>
       </div>

       {post.poll && (
         <div className="mt-4 bg-black/20 rounded-2xl p-4 border border-white/5 shadow-inner">
            <h4 className="text-white font-semibold mb-3">{post.poll.question}</h4>
            <div className="space-y-2">
               {post.poll.options.map((opt: any, idx: number) => {
                  const totalVotes = post.poll.options.reduce((acc: number, curr: any) => acc + curr.votes.length, 0);
                  const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                  const hasVotedThis = opt.votes.includes(user?.uid);
                  
                  return (
                     <button 
                       key={idx}
                       onClick={() => handleVote(idx)}
                       aria-label={`Vote for ${opt.text}. Current votes: ${opt.votes.length} (${percent}%)`}
                       className={`relative w-full text-left overflow-hidden rounded-xl border transition-all group ${hasVotedThis ? 'border-[var(--color-brand-accent-purple)] bg-[var(--color-brand-accent-purple)]/10 shadow-[0_0_15px_rgba(124,58,237,0.15)]' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
                     >
                        <motion.div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-brand-accent-purple)]/30 to-[var(--color-brand-accent-cyan)]/20 group-hover:from-[var(--color-brand-accent-purple)]/40 group-hover:to-[var(--color-brand-accent-cyan)]/30 transition-colors"
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, type: "spring", bounce: 0 }}
                        />
                        <div className="relative z-10 p-3 flex justify-between items-center">
                           <span className={`text-sm font-medium pr-4 ${hasVotedThis ? 'text-white font-bold' : 'text-gray-200'}`}>{opt.text}</span>
                           <span className={`text-sm font-bold min-w-[40px] text-right ${hasVotedThis ? 'text-[var(--color-brand-accent-cyan)]' : 'text-gray-400'}`}>{percent}%</span>
                        </div>
                     </button>
                  )
               })}
            </div>
            <div className="text-right text-[10px] text-gray-500 mt-2 font-medium uppercase tracking-wider">
               {post.poll.options.reduce((acc: number, curr: any) => acc + curr.votes.length, 0)} Votes
            </div>
         </div>
       )}
       
       <div className="mt-4 flex items-center gap-2 relative">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowPicker(!showPicker)} className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
             <SmilePlus size={16} />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => onReplyClick?.(post)} 
            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold rounded-md border border-white/5"
          >
             <MessageCircle size={14} />
             {!isReply ? (post.replyCount > 0 ? `${post.replyCount} Replies` : 'Reply') : 'Reply to Thread'}
          </motion.button>

          <div className="flex flex-wrap gap-1.5 ml-2">
             {reactionsEntries.map(([emoji, users]: any) => {
                const iReacted = users.includes(user?.uid);
                return (
                  <motion.button 
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.9 }}
                     key={emoji} 
                     onClick={() => handleReact(emoji)}
                     className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-colors ${iReacted ? 'bg-[var(--color-brand-accent-purple)]/20 border-[var(--color-brand-accent-purple)]/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                  >
                     <span>{emoji}</span>
                     <span className={iReacted ? 'text-purple-300 font-medium' : 'text-gray-400'}>{users.length}</span>
                  </motion.button>
                )
             })}
          </div>

          <AnimatePresence>
             {showPicker && (
               <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="absolute pt-2 bottom-full left-0 mb-1 bg-[#2A2A4A] border border-white/10 rounded-2xl p-2 shadow-2xl flex gap-1 z-20">
                 {EMOJIS.map(e => (
                    <button key={e} onClick={() => handleReact(e)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-xl transition-transform hover:scale-110 text-white">
                       {e}
                    </button>
                 ))}
               </motion.div>
             )}
          </AnimatePresence>
       </div>
    </motion.div>
  );
};

const ReplyNode = ({ reply, threadId, classroomId, onReplyClick, depth = 1 }: any) => {
  return (
    <div className={`mt-3 ${depth > 1 ? 'ml-6 border-l-2 border-white/10 pl-5' : ''}`}>
      <ForumPost post={reply} isReply={true} classroomId={classroomId} threadId={threadId} onReplyClick={onReplyClick} depth={depth} />
      {reply.children && reply.children.length > 0 && (
         <div className="space-y-3">
           {reply.children.map((child: any) => (
             <ReplyNode key={child.id} reply={child} threadId={threadId} classroomId={classroomId} onReplyClick={onReplyClick} depth={depth + 1} />
           ))}
         </div>
      )}
    </div>
  )
}

export default function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [classroom, setClassroom] = useState<any>(null);
  const [showQr, setShowQr] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'forum'>('info');

  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [sending, setSending] = useState(false);

  // Threading state
  const [activeThread, setActiveThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  // Poll state
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    const unSub = onSnapshot(doc(db, 'classrooms', id), snap => {
      if (snap.exists()) setClassroom({ id: snap.id, ...snap.data() });
    });
    
    const postsQuery = query(collection(db, `classrooms/${id}/posts`), orderBy('createdAt', 'desc'));
    const unSubPosts = onSnapshot(postsQuery, snap => {
      const p: any[] = [];
      snap.forEach(d => p.push({ id: d.id, ...d.data() }));
      setPosts(p);
      
      // Update active thread data if it was modified 
      if (activeThread) {
         const updatedThread = p.find(post => post.id === activeThread.id);
         if (updatedThread) setActiveThread(updatedThread);
      }
    });

    return () => {
       unSub();
       unSubPosts();
    };
  }, [id, activeThread?.id]);

  useEffect(() => {
    if (!activeThread || !id) return;
    const repQ = query(collection(db, `classrooms/${id}/posts/${activeThread.id}/replies`), orderBy('createdAt', 'asc'));
    const unSubR = onSnapshot(repQ, snap => {
       const r: any[] = [];
       snap.forEach(d => r.push({ id: d.id, ...d.data() }));
       setReplies(r);
    });
    return () => unSubR();
  }, [activeThread, id]);

  const handlePost = async () => {
    const hasText = newPost.trim().length > 0;
    const hasPoll = isCreatingPoll && pollQuestion.trim().length > 0 && pollOptions.filter(o => o.trim()).length >= 2;

    if ((!hasText && !hasPoll) || !user || !id) return;
    setSending(true);

    let pollData = null;
    if (hasPoll) {
       pollData = {
         question: pollQuestion.trim(),
         options: pollOptions.filter(o => o.trim()).map(o => ({ text: o.trim(), votes: [] }))
       };
    }

    try {
      if (activeThread) {
         await addDoc(collection(db, `classrooms/${id}/posts/${activeThread.id}/replies`), {
           text: newPost.trim(),
           authorId: user.uid,
           authorName: profile?.displayName || user.email || 'Member',
           authorAvatar: profile?.avatarUrl || null,
           createdAt: serverTimestamp(),
           reactions: {},
           poll: pollData,
           parentId: replyingTo ? replyingTo.id : null
         });
         await updateDoc(doc(db, `classrooms/${id}/posts/${activeThread.id}`), {
           replyCount: increment(1)
         });
         setReplyingTo(null);
      } else {
         await addDoc(collection(db, `classrooms/${id}/posts`), {
           text: newPost.trim(),
           authorId: user.uid,
           authorName: profile?.displayName || user.email || 'Member',
           authorAvatar: profile?.avatarUrl || null,
           createdAt: serverTimestamp(),
           replyCount: 0,
           poll: pollData,
           reactions: {}
         });
      }
      setNewPost('');
      setIsCreatingPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleReplyClick = (postToReplyTo: any) => {
     if (!activeThread) {
        setActiveThread(postToReplyTo);
        setReplyingTo(null);
     } else {
        setReplyingTo(postToReplyTo);
     }
  };

  const insertFormatting = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + (selection || 'text') + suffix + after;
    setNewPost(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selection || 'text').length);
    }, 0);
  };

  const replyTree = React.useMemo(() => {
    const map = new Map<string, any>();
    replies.forEach(r => map.set(r.id, { ...r, children: [] }));
    const tree: any[] = [];
    map.forEach(r => {
      if (r.parentId && map.has(r.parentId)) {
        map.get(r.parentId).children.push(r);
      } else {
        tree.push(r);
      }
    });
    return tree;
  }, [replies]);

  if (!classroom) return <div className="text-white p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg-primary)] flex flex-col">
      <div className="sticky top-0 z-40 bg-[#0F0F0F]/80 backdrop-blur-3xl border-b border-white/5 py-3 px-4 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="text-white p-2 hover:bg-white/10 rounded-full mr-2 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-white font-semibold text-xl leading-tight">{classroom.name}</h2>
              <p className="text-[var(--color-brand-text-secondary)] text-xs font-medium">{classroom.type || 'Classroom'} • {classroom.members?.length} Members</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowQr(true)} className="p-2 bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-accent-cyan)] rounded-xl border border-white/5">
             <QrCode size={20} />
          </motion.button>
        </div>
        
        <div className="flex space-x-1 bg-[#1A1A2E] p-1 rounded-xl border border-white/5">
           <button 
             onClick={() => setActiveTab('info')}
             className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'info' ? 'bg-[#2A2A4A] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
           >
             Details
           </button>
           <button 
             onClick={() => setActiveTab('forum')}
             className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all flex justify-center items-center ${activeTab === 'forum' ? 'bg-[#2A2A4A] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
           >
             <MessageSquare size={14} className="mr-1.5" /> Forum
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto pb-28">
         {activeTab === 'info' && (
           <div className="p-4 space-y-6">
             <div className="bg-[#1A1A2E] rounded-[24px] p-8 border border-white/5 text-center shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-brand-accent-purple)]/20 blur-3xl rounded-full pointer-events-none"></div>
                <h3 className="text-gray-400 text-sm mb-3 font-semibold uppercase tracking-wider">Space Join Code</h3>
                <div className="text-4xl text-white font-mono tracking-[0.2em] mb-4 bg-[#0F0F0F] rounded-2xl py-5 inline-block px-8 border border-[var(--color-brand-accent-cyan)]/30 backdrop-blur-md shadow-inner">
                   {classroom.code}
                </div>
                <p className="text-gray-400 text-sm">Share this unique code to let others join your {classroom.type?.toLowerCase() || 'space'}.</p>
             </div>
             
             <div className="bg-[#1A1A2E] rounded-[24px] p-6 border border-white/5">
                 <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
                   <Users size={18} className="mr-2 text-[var(--color-brand-accent-purple)]" /> Roster
                 </h3>
                 <p className="text-gray-400 text-sm">
                   {classroom.members?.length} active participants connected. Full directory access requires administrative verification.
                 </p>
             </div>
           </div>
         )}

         {activeTab === 'forum' && (
           <div className="flex flex-col h-full relative">
              <div className="p-4 space-y-4 flex-1 pb-16">
                 {activeThread ? (
                   <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                      <button onClick={() => { setActiveThread(null); setReplyingTo(null); }} className="flex items-center text-gray-400 hover:text-white font-medium mb-2 transition-colors">
                         <ChevronLeft size={18} className="mr-1" /> Back to Discussions
                      </button>
                      <ForumPost post={activeThread} classroomId={id} onReplyClick={handleReplyClick} />
                      <div className="pl-6 border-l-[3px] border-white-[0.03] space-y-3 py-2">
                        {replyTree.map(r => (
                          <ReplyNode key={r.id} reply={r} threadId={activeThread.id} classroomId={id} onReplyClick={handleReplyClick} />
                        ))}
                      </div>
                      {replies.length === 0 && <div className="text-gray-500 text-sm ml-6">No replies yet.</div>}
                   </motion.div>
                 ) : posts.length === 0 ? (
                   <div className="text-center py-10 text-gray-500 border border-dashed border-white/10 rounded-3xl m-4">
                     No discussions started yet. Be the first!
                   </div>
                 ) : (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                     {posts.map(p => (
                       <ForumPost key={p.id} post={p} classroomId={id} onReplyClick={handleReplyClick} />
                     ))}
                   </motion.div>
                 )}
              </div>
              
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-brand-bg-primary)] via-[#0F0F0F]/90 to-transparent pt-10 pb-[max(env(safe-area-inset-bottom),1rem)] z-30 pointer-events-none">
                <div className="w-full max-w-3xl mx-auto flex flex-col pointer-events-auto">
                  {replyingTo && (
                    <div className="mb-2 px-4 py-2 bg-white/5 rounded-t-2xl border border-b-0 border-white/10 text-sm text-gray-300 flex justify-between items-center backdrop-blur-md">
                       <span className="truncate">Replying to <span className="font-semibold">{replyingTo.authorName}</span>...</span>
                       <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-white p-1">✕</button>
                    </div>
                  )}
                  <div className={`flex flex-col relative bg-[#1A1A2E] border border-white/10 shadow-2xl p-2 ${replyingTo ? 'rounded-b-3xl rounded-t-none' : 'rounded-3xl'}`}>
                    
                    {/* Rich Formatting Toolbar */}
                    <div className="flex items-center gap-1.5 px-2 pb-2 mb-1 border-b border-white/5 overflow-x-auto no-scrollbar">
                       <button onClick={() => insertFormatting('**', '**')} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors" title="Bold"><Bold size={15} /></button>
                       <button onClick={() => insertFormatting('*', '*')} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors" title="Italic"><Italic size={15} /></button>
                       <button onClick={() => insertFormatting('[', '](url)')} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors" title="Link"><Link2 size={15} /></button>
                       <button onClick={() => insertFormatting('`', '`')} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors" title="Code"><Code size={15} /></button>
                       <div className="w-px h-4 bg-white/10 mx-1" />
                       <button onClick={() => insertFormatting('@', '')} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-[var(--color-brand-accent-purple)]/20 hover:text-[var(--color-brand-accent-purple)] transition-colors" title="Mention"><AtSign size={15} /></button>
                       <div className="w-px h-4 bg-white/10 mx-1" />
                       <button onClick={() => setIsCreatingPoll(!isCreatingPoll)} className={`p-1.5 rounded-md transition-colors ${isCreatingPoll ? 'text-[var(--color-brand-accent-cyan)] bg-[var(--color-brand-accent-cyan)]/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} title="Create Poll"><BarChart2 size={15} /></button>
                    </div>

                    {isCreatingPoll && (
                      <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="px-3 pb-3 mb-2 border-b border-white/5 space-y-2.5">
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-[var(--color-brand-accent-cyan)] uppercase tracking-wider">Poll Creator</span>
                            <button onClick={() => setIsCreatingPoll(false)} className="text-gray-500 hover:text-white bg-white/5 rounded-full p-1"><X size={12} /></button>
                         </div>
                         <input 
                           type="text" 
                           placeholder="Ask a question..." 
                           value={pollQuestion}
                           onChange={e => setPollQuestion(e.target.value)}
                           className="w-full bg-black/20 text-white rounded-lg px-3 py-2 text-sm outline-none border border-white/5 focus:border-[var(--color-brand-accent-purple)] transition-colors"
                         />
                         <div className="space-y-2">
                            {pollOptions.map((opt, idx) => (
                               <div key={idx} className="flex items-center gap-2">
                                  <input 
                                    type="text" 
                                    placeholder={`Option ${idx + 1}`} 
                                    value={opt}
                                    onChange={e => {
                                      const newOpts = [...pollOptions];
                                      newOpts[idx] = e.target.value;
                                      setPollOptions(newOpts);
                                    }}
                                    className="flex-1 bg-black/20 text-white rounded-xl px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-[var(--color-brand-accent-purple)] transition-colors placeholder:text-gray-600"
                                  />
                                  {pollOptions.length > 2 && (
                                     <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-400 p-2 hover:bg-red-400/10 rounded-lg transition-colors" title="Remove option"><X size={16}/></button>
                                  )}
                               </div>
                            ))}
                         </div>
                         {pollOptions.length < 10 && (
                           <button onClick={() => setPollOptions([...pollOptions, ''])} className="w-full mt-2 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-[var(--color-brand-accent-purple)] font-semibold hover:text-[var(--color-brand-accent-cyan)] flex items-center justify-center transition-all border border-dashed border-white/10 hover:border-[var(--color-brand-accent-purple)]/50">
                              <Plus size={16} className="mr-1.5" /> Add Another Option
                           </button>
                         )}
                      </motion.div>
                    )}

                    <div className="flex items-center w-full relative">
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder={activeThread ? (replyingTo ? 'Type your reply...' : `Reply to ${activeThread.authorName}...`) : "Start a discussion. Add a poll via the toolbar!"}
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePost();
                          }
                        }}
                        className="flex-1 bg-transparent text-white rounded-2xl pl-2 pr-12 pt-2 pb-2 outline-none resize-none max-h-32 min-h-[44px] placeholder:text-gray-500 text-[15px]"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePost}
                        disabled={(!newPost.trim() && !(isCreatingPoll && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2)) || sending}
                        className="absolute right-1 bottom-1 p-2 bg-gradient-to-r from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] text-white rounded-[14px] disabled:opacity-50 shadow-lg"
                      >
                        <Send size={16} className="translate-x-[1px]" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
           </div>
         )}
      </div>

      {showQr && (
         <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowQr(false)}>
            <div className="bg-white p-8 rounded-[36px] w-full max-w-sm flex flex-col items-center shadow-2xl" onClick={e => e.stopPropagation()}>
               <QRCodeSVG value={classroom.code} size={220} />
               <h3 className="text-black font-bold text-2xl mt-8 text-center leading-tight">{classroom.name}</h3>
               <p className="text-gray-500 mt-2 text-center text-sm px-4">Scan with phone camera or use code <strong className="font-mono text-black">{classroom.code}</strong></p>
               <button onClick={() => setShowQr(false)} className="mt-8 px-6 py-4 bg-gray-100 text-gray-800 rounded-2xl font-bold w-full hover:bg-gray-200 active:scale-[0.98] transition-all">Close Scanner</button>
            </div>
         </div>
      )}
    </div>
  );
}
