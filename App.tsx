
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  RotateCcw, 
  Upload, 
  Trash2, 
  Plus, 
  Trophy, 
  Sparkles,
  Zap,
  LayoutDashboard,
  Clock,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { Student, HistoryItem } from './types.ts';
import { generateIcebreaker } from './services/geminiService.ts';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import * as XLSX from 'xlsx';

// Component: Neon Button
const NeonButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "relative overflow-hidden px-6 py-2 rounded-lg font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-cyan-500/10 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]",
    secondary: "bg-fuchsia-500/10 border border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-black shadow-[0_0_15px_rgba(240,0,255,0.3)]",
    danger: "bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500 hover:text-black shadow-[0_0_15px_rgba(255,0,0,0.3)]"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

// Component: Glass Card
const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [aiChallenge, setAiChallenge] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'list' | 'history'>('main');
  const [newName, setNewName] = useState('');
  const [activeName, setActiveName] = useState<string>('???');
  const spinnerInterval = useRef<number | null>(null);

  // Load from local storage
  useEffect(() => {
    const savedStudents = localStorage.getItem('cybercall_students');
    const savedHistory = localStorage.getItem('cybercall_history');
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('cybercall_students', JSON.stringify(students));
    localStorage.setItem('cybercall_history', JSON.stringify(history));
  }, [students, history]);

  const addStudent = () => {
    if (!newName.trim()) return;
    const newStudent: Student = { id: crypto.randomUUID(), name: newName.trim() };
    setStudents([...students, newStudent]);
    setNewName('');
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const names = json
        .map(row => row[0])
        .filter(name => name && String(name).trim().length > 0)
        .map(name => String(name).trim());

      const newStudents = names.map(name => ({ id: crypto.randomUUID(), name }));
      setStudents(prev => [...prev, ...newStudents]);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const names = text.split(/\r?\n/).filter(name => name.trim().length > 0);
        const newStudents = names.map(name => ({ id: crypto.randomUUID(), name: name.trim() }));
        setStudents(prev => [...prev, ...newStudents]);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const startSpin = useCallback(async () => {
    if (students.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedStudent(null);
    setAiChallenge(null);

    let speed = 50;
    let iterations = 0;
    const maxIterations = 35;

    const spin = () => {
      const randomIndex = Math.floor(Math.random() * students.length);
      setActiveName(students[randomIndex].name);
      
      iterations++;
      if (iterations < maxIterations) {
        speed += (iterations < 20 ? 5 : 20); // 先快后慢
        spinnerInterval.current = window.setTimeout(spin, speed);
      } else {
        const finalWinner = students[Math.floor(Math.random() * students.length)];
        finishSelection(finalWinner);
      }
    };

    spin();
  }, [students, isSpinning]);

  const finishSelection = async (winner: Student) => {
    setIsSpinning(false);
    setSelectedStudent(winner);
    setActiveName(winner.name);
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ffff', '#f000ff', '#ffffff']
    });

    const challenge = await generateIcebreaker(winner.name);
    setAiChallenge(challenge);
    
    setHistory(prev => [{
      timestamp: Date.now(),
      student: winner,
      challenge
    }, ...prev].slice(0, 50));
  };

  const resetSelection = () => {
    setSelectedStudent(null);
    setAiChallenge(null);
    setActiveName('???');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-6 relative z-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.5)]">
            <Zap className="text-black" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-orbitron font-black neon-text text-cyan-400">赛博点名</h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest">CYBER-CALL v3.0 // 智慧课堂助手</p>
          </div>
        </div>
        
        <nav className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          <button 
            onClick={() => setView('main')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'main' ? 'bg-cyan-500 text-black font-bold' : 'hover:bg-white/10 text-gray-400'}`}
          >
            <LayoutDashboard size={18} /> <span className="hidden sm:inline">点名大厅</span>
          </button>
          <button 
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'list' ? 'bg-cyan-500 text-black font-bold' : 'hover:bg-white/10 text-gray-400'}`}
          >
            <Users size={18} /> <span className="hidden sm:inline">名单管理 ({students.length})</span>
          </button>
          <button 
            onClick={() => setView('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'history' ? 'bg-cyan-500 text-black font-bold' : 'hover:bg-white/10 text-gray-400'}`}
          >
            <Clock size={18} /> <span className="hidden sm:inline">历史记录</span>
          </button>
        </nav>
      </header>

      {/* Main View */}
      {view === 'main' && (
        <div className="flex flex-col items-center justify-center flex-grow py-12 gap-8">
          <div className="relative w-full max-w-2xl aspect-video flex flex-col items-center justify-center">
            <div className={`w-full h-full flex items-center justify-center border-2 rounded-3xl transition-all duration-500 ${isSpinning ? 'border-fuchsia-500 shadow-[0_0_50px_rgba(240,0,255,0.3)]' : 'border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.1)]'} bg-black/40 backdrop-blur-xl relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00ffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="relative z-10 text-center px-4">
                <span className="text-xs font-orbitron text-cyan-500/50 block mb-4 tracking-[0.3em]">
                  {isSpinning ? '正在扫描数据库...' : selectedStudent ? '锁定目标' : '等待点名指令'}
                </span>
                <h2 className={`text-5xl md:text-8xl font-black transition-all duration-150 ${isSpinning ? 'text-fuchsia-400 blur-[2px]' : selectedStudent ? 'text-cyan-400 neon-text scale-110' : 'text-white/20'}`}>
                  {activeName}
                </h2>
                {aiChallenge && (
                  <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <p className="text-cyan-400 font-medium italic flex items-center justify-center gap-2">
                      <Sparkles size={16} /> {aiChallenge}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-12 flex gap-4">
              {selectedStudent ? (
                <NeonButton onClick={resetSelection} variant="secondary" className="px-8 py-4">
                  <RotateCcw className="inline mr-2" size={20} /> 重置状态
                </NeonButton>
              ) : (
                <NeonButton 
                  onClick={startSpin} 
                  disabled={isSpinning || students.length === 0} 
                  className="px-12 py-5 text-xl group"
                >
                  <Trophy className="inline mr-2 group-hover:scale-125 transition-transform" size={24} /> 
                  {isSpinning ? '搜索中...' : '开始随机点名'}
                </NeonButton>
              )}
            </div>
            {students.length === 0 && (
              <p className="mt-4 text-red-400/80 text-sm font-bold animate-pulse">
                警告：数据库中未检测到学生数据
              </p>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-left-4">
          <div className="md:col-span-1 space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <Plus size={20} /> 添加学生
              </h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addStudent()}
                  placeholder="输入姓名..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-cyan-500 focus:outline-none transition-colors"
                />
                <NeonButton onClick={addStudent} className="w-full">
                  确认注册
                </NeonButton>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-fuchsia-500/30">
              <h3 className="text-xl font-bold text-fuchsia-400 mb-4 flex items-center gap-2">
                <FileSpreadsheet size={20} /> 批量上传 (Excel/CSV)
              </h3>
              <p className="text-xs text-gray-400 mb-4">支持 .xlsx, .xls, .csv, .txt。系统将读取第一列姓名。</p>
              <label className="block">
                <span className="sr-only">选择文件</span>
                <input 
                  type="file" 
                  accept=".txt,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-500 file:text-black hover:file:bg-fuchsia-600 cursor-pointer"
                />
              </label>
            </GlassCard>

            <NeonButton 
              onClick={() => { if(confirm('确定要清除所有数据吗？此操作不可撤销。')) setStudents([]); }} 
              variant="danger" 
              className="w-full"
            >
              <Trash2 className="inline mr-2" size={18} /> 清空所有名单
            </NeonButton>
          </div>

          <div className="md:col-span-2">
            <GlassCard className="h-full">
              <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900/90 backdrop-blur-md z-10">
                <h3 className="font-bold text-white">学生数据库</h3>
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30">
                  共 {students.length} 名成员
                </span>
              </div>
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {students.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 italic">暂无学生数据。</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {students.map((s) => (
                      <div key={s.id} className="group flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg hover:border-cyan-500/50 transition-all">
                        <span className="font-medium">{s.name}</span>
                        <button 
                          onClick={() => removeStudent(s.id)}
                          className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* History View */}
      {view === 'history' && (
        <div className="animate-in fade-in slide-in-from-right-4">
          <GlassCard className="max-w-3xl mx-auto">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white">本次点名记录</h3>
              <NeonButton onClick={() => setHistory([])} variant="danger" className="py-1 px-3 text-xs">
                清除日志
              </NeonButton>
            </div>
            <div className="divide-y divide-white/10 overflow-hidden">
              {history.length === 0 ? (
                <div className="py-20 text-center text-gray-500">尚无点名活动。</div>
              ) : (
                history.map((item, idx) => (
                  <div key={item.timestamp} className="p-6 hover:bg-white/5 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/30 text-xs">
                          #{history.length - idx}
                        </div>
                        <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {item.student.name}
                        </h4>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {item.challenge && (
                      <p className="text-sm text-gray-400 italic flex items-center gap-2 pl-11">
                        <ChevronRight size={14} className="text-cyan-500" /> {item.challenge}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto pt-8 pb-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-600 font-mono">
        <div className="flex gap-4">
          <span>系统状态: 稳定</span>
          <span>连接延迟: 正常</span>
          <span>核心协议: 加密通信</span>
        </div>
        <div>
          教师专用版本 // <span className="text-cyan-900">AI 技术驱动：GEMINI 3.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
