
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, RotateCcw, Upload, Trash2, Plus, Trophy, Sparkles,
  Zap, LayoutDashboard, Clock, ChevronRight, FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { Student, HistoryItem } from './types.ts';
import { generateIcebreaker } from './services/geminiService.ts';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';

// 赛博风格按钮
const NeonButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = '', disabled = false }) => {
  const variants = {
    primary: "bg-cyan-500/10 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]",
    secondary: "bg-fuchsia-500/10 border border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-black shadow-[0_0_15px_rgba(240,0,255,0.3)]",
    danger: "bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500 hover:text-black shadow-[0_0_15px_rgba(255,0,0,0.3)]"
  };
  return (
    <button 
      onClick={onClick} 
      className={`relative overflow-hidden px-6 py-2 rounded-lg font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// 磨砂玻璃卡片
const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
    {children}
  </div>
);

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [aiChallenge, setAiChallenge] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'list' | 'history'>('main');
  const [newName, setNewName] = useState('');
  const [activeName, setActiveName] = useState<string>('???');
  const spinnerInterval = useRef<number | null>(null);

  // 初始化加载
  useEffect(() => {
    const saved = localStorage.getItem('cybercall_students');
    const savedHist = localStorage.getItem('cybercall_history');
    if (saved) setStudents(JSON.parse(saved));
    if (savedHist) setHistory(JSON.parse(savedHist));
  }, []);

  // 实时保存
  useEffect(() => {
    localStorage.setItem('cybercall_students', JSON.stringify(students));
    localStorage.setItem('cybercall_history', JSON.stringify(history));
  }, [students, history]);

  // 文件解析逻辑
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.match(/\.(xlsx|xls)$/)) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const json: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        const names = json.flat().filter(n => n && typeof n !== 'object').map(n => String(n).trim());
        setStudents(prev => [...prev, ...names.map(name => ({ id: crypto.randomUUID(), name }))]);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const names = (ev.target?.result as string).split(/\r?\n/).filter(n => n.trim());
          setStudents(prev => [...prev, ...names.map(name => ({ id: crypto.randomUUID(), name: name.trim() }))]);
        };
        reader.readAsText(file);
      }
    } catch (err) { alert("文件格式不兼容，请使用标准 Excel 或 TXT"); }
    e.target.value = '';
  };

  // 核心抽奖逻辑
  const startSpin = useCallback(() => {
    if (students.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setSelectedStudent(null);
    setAiChallenge(null);
    
    let speed = 40;
    let count = 0;
    const maxIterations = 35 + Math.floor(Math.random() * 10);

    const spin = () => {
      const randomIndex = Math.floor(Math.random() * students.length);
      setActiveName(students[randomIndex].name);
      
      if (++count < maxIterations) {
        // 模拟减速效果
        if (count > maxIterations - 10) speed += 50;
        else if (count > maxIterations - 20) speed += 20;
        spinnerInterval.current = window.setTimeout(spin, speed);
      } else {
        const winner = students[Math.floor(Math.random() * students.length)];
        onFinish(winner);
      }
    };
    spin();
  }, [students, isSpinning]);

  const onFinish = async (winner: Student) => {
    setIsSpinning(false);
    setSelectedStudent(winner);
    setActiveName(winner.name);
    
    // 庆祝特效
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00ffff', '#f000ff', '#ffffff']
    });

    // AI 生成挑战
    const challenge = await generateIcebreaker(winner.name);
    setAiChallenge(challenge);
    
    // 更新历史
    setHistory(prev => [{
      timestamp: Date.now(),
      student: winner,
      challenge
    }, ...prev].slice(0, 50));
  };

  return (
    <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto flex flex-col gap-8 relative z-10">
      {/* 顶部导航 */}
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 group">
          <div className="p-4 bg-cyan-500 rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-transform group-hover:rotate-12">
            <Zap className="text-black" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-orbitron font-black neon-text text-cyan-400 tracking-tighter">CYBER-CALL</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-1 w-1 bg-green-500 rounded-full animate-ping"></span>
              <p className="text-[10px] text-gray-500 tracking-[0.3em] uppercase font-bold">Smart Classroom Node v3.4.2</p>
            </div>
          </div>
        </div>
        
        <nav className="flex bg-gray-800/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          {[
            { id: 'main', icon: LayoutDashboard, label: '点名大厅' },
            { id: 'list', icon: Users, label: '名单管理' },
            { id: 'history', icon: Clock, label: '点名历史' }
          ].map(btn => (
            <button 
              key={btn.id}
              onClick={() => setView(btn.id as any)} 
              className={`px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-500 ${view === btn.id ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <btn.icon size={18}/>
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* 主视图 */}
      <main className="flex-grow flex flex-col">
        {view === 'main' && (
          <div className="flex-grow flex flex-col items-center justify-center py-8 animate-in zoom-in duration-500">
            <div className={`relative w-full max-w-3xl aspect-[16/9] rounded-[40px] border-4 flex flex-col items-center justify-center bg-black/60 backdrop-blur-2xl transition-all duration-700 ${isSpinning ? 'border-fuchsia-500 shadow-[0_0_100px_rgba(240,0,255,0.2)]' : 'border-cyan-500/20 shadow-[0_0_60px_rgba(0,255,255,0.05)]'}`}>
              
              {/* 背景装饰 */}
              <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-[40px]">
                <div className="absolute inset-0 grid grid-cols-12 gap-1 px-4 opacity-20">
                   {[...Array(48)].map((_, i) => <div key={i} className="h-full border-r border-cyan-500"></div>)}
                </div>
              </div>

              <span className="font-orbitron text-cyan-500/60 text-sm tracking-[0.5em] mb-6 relative">
                {isSpinning ? 'ENCRYPTING CANDIDATE...' : 'CORE STATUS: STABLE'}
              </span>

              <h2 className={`text-7xl md:text-9xl font-black text-center px-6 transition-all duration-75 uppercase tracking-tighter ${isSpinning ? 'text-fuchsia-400 blur-[3px] scale-90 skew-x-12' : selectedStudent ? 'text-cyan-400 neon-text scale-110 drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]' : 'text-white/10'}`}>
                {activeName}
              </h2>

              {aiChallenge && (
                <div className="mt-12 mx-6 p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl animate-in slide-in-from-bottom-6 duration-700">
                  <p className="text-cyan-400 italic text-lg text-center flex items-center justify-center gap-3">
                    <Sparkles className="shrink-0 animate-pulse" size={24}/> 
                    <span className="font-medium tracking-wide">“{aiChallenge}”</span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-14 flex flex-col items-center gap-6">
              {selectedStudent ? (
                <NeonButton onClick={() => {setSelectedStudent(null); setActiveName('???'); setAiChallenge(null);}} variant="secondary" className="px-14 py-5 text-lg rounded-2xl group">
                  <RotateCcw size={22} className="group-hover:rotate-180 transition-transform duration-500"/>
                  <span>重新扫描</span>
                </NeonButton>
              ) : (
                <NeonButton onClick={startSpin} disabled={students.length === 0 || isSpinning} className="px-24 py-7 text-2xl rounded-2xl">
                  <Trophy size={28}/>
                  <span className="font-orbitron tracking-widest">{isSpinning ? 'PROCESSING...' : 'INITIATE CALL'}</span>
                </NeonButton>
              )}
              {students.length === 0 && (
                <div className="flex items-center gap-2 text-red-500/80 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 animate-pulse">
                   <ShieldCheck size={16}/>
                   <span className="text-xs font-bold uppercase tracking-widest">Database Offline: Please load user list</span>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-left-10 duration-500">
            <div className="space-y-6">
              <GlassCard className="p-8">
                <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-3"><Plus size={22}/> 手动录入</h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={e=>setNewName(e.target.value)} 
                    onKeyDown={e=>e.key==='Enter'&& (newName.trim() && (setStudents([...students, {id:crypto.randomUUID(), name:newName.trim()}]), setNewName('')))} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-lg" 
                    placeholder="输入学生姓名..."
                  />
                  <NeonButton onClick={()=>{if(newName.trim()){setStudents([...students, {id:crypto.randomUUID(), name:newName.trim()}]); setNewName('');}}} className="w-full py-3">添加到数据库</NeonButton>
                </div>
              </GlassCard>

              <GlassCard className="p-8 border-fuchsia-500/20">
                <h3 className="text-xl font-bold text-fuchsia-400 mb-3 flex items-center gap-3"><FileSpreadsheet size={22}/> 批量导入</h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">支持 Excel (.xlsx, .xls) 或 TXT 文件。每行或每个单元格将被识别为一个姓名。</p>
                <label className="block w-full cursor-pointer group">
                  <div className="border-2 border-dashed border-white/10 group-hover:border-fuchsia-500/50 rounded-2xl p-8 text-center transition-all">
                    <Upload className="mx-auto text-gray-500 group-hover:text-fuchsia-400 mb-3" size={32}/>
                    <span className="text-sm text-gray-400 group-hover:text-white">点击或拖拽文件上传</span>
                  </div>
                  <input type="file" onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls,.txt,.csv"/>
                </label>
              </GlassCard>

              <NeonButton onClick={()=>confirm('确定清空所有名单吗？此操作不可撤销。')&&setStudents([])} variant="danger" className="w-full py-3 opacity-50 hover:opacity-100 transition-opacity">
                <Trash2 size={18}/> 清空当前数据库
              </NeonButton>
            </div>

            <div className="lg:col-span-2">
              <GlassCard className="h-full flex flex-col">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 bg-cyan-400 rounded-full"></span>
                    <h3 className="font-bold text-lg">活跃学生数据库</h3>
                  </div>
                  <span className="text-xs font-orbitron bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30">
                    COUNT: {students.length}
                  </span>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto max-h-[60vh]">
                  {students.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-600 font-bold uppercase tracking-widest italic">Empty Database</div>
                  ) : (
                    students.map(s => (
                      <div key={s.id} className="group flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all animate-in fade-in zoom-in duration-300">
                        <span className="truncate font-medium">{s.name}</span>
                        <button onClick={()=>setStudents(students.filter(x=>x.id!==s.id))} className="text-red-500/40 hover:text-red-500 transition-colors p-1">×</button>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="max-w-4xl mx-auto w-full animate-in slide-in-from-right-10 duration-500">
            <GlassCard>
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-lg flex items-center gap-3"><Clock className="text-cyan-400"/> 点名操作日志</h3>
                <button onClick={()=>setHistory([])} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase">清除所有日志</button>
              </div>
              <div className="divide-y divide-white/5">
                {history.length === 0 ? (
                  <div className="p-24 text-center text-gray-600 italic font-bold uppercase tracking-[0.2em]">No logs recorded</div>
                ) : (
                  history.map((item, i) => (
                    <div key={item.timestamp} className="p-8 hover:bg-white/5 transition-colors group">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400">
                            {history.length - i}
                          </div>
                          <span className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">{item.student.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono bg-black/40 px-3 py-1 rounded-full">{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                        <ChevronRight size={18} className="text-cyan-500 mt-0.5 shrink-0"/>
                        <p className="text-gray-400 italic leading-relaxed">{item.challenge}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </main>

      {/* 底部信息 */}
      <footer className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-widest">
        <div className="flex gap-4">
          <span>S-ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          <span>Latency: 24ms</span>
        </div>
        <div>CyberCall // Designed for Educators</div>
      </footer>
    </div>
  );
}
