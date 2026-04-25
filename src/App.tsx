/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calculator, Box, Link2, Send, MessageCircle, Layers, Copy, Check } from 'lucide-react';

const STRESS_UNITS: Record<string, number> = { 
  'MPa (N/mm²)': 1, 
  'kN/m²': 1000, 
  'Ton/m²': 101.97, 
  'kg/cm²': 10.197, 
  'kg/m²': 101970 
};

const DENSITY_UNITS: Record<string, number> = { 
  'Ton/m³': 1, 
  'kg/m³': 1000, 
  'kN/m³': 1000 / 101.97 
};

const UNITLESS_UNITS: Record<string, number> = { '': 1 };

function PropertyBox({ 
  label, 
  valueBase, 
  type,
  decimals = 2,
  themeColor = 'cyan',
  equation,
  forceUnit
}: { 
  label: string, 
  valueBase: number, 
  type: 'stress' | 'density' | 'unitless',
  decimals?: number,
  themeColor?: 'cyan' | 'blue',
  equation?: React.ReactNode,
  forceUnit?: string
}) {
  const units = type === 'stress' ? STRESS_UNITS : type === 'density' ? DENSITY_UNITS : UNITLESS_UNITS;

  const [unit, setUnit] = useState<string>(
    forceUnit && Object.keys(units).includes(forceUnit) 
      ? forceUnit 
      : (type === 'stress' ? 'MPa (N/mm²)' : type === 'density' ? 'Ton/m³' : '')
  );

  useEffect(() => {
    if (forceUnit && Object.keys(units).includes(forceUnit)) {
      setUnit(forceUnit);
    }
  }, [forceUnit, type]);

  const [copied, setCopied] = useState(false);

  const multiplier = units[unit] || 1;
  const displayValue = valueBase * multiplier;

  const formattedValue = Number.isFinite(displayValue) 
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(displayValue)
    : '0';

  const rawValueToCopy = Number.isFinite(displayValue) 
    ? Number(displayValue.toFixed(decimals)).toString()
    : '0';

  const isCyan = themeColor === 'cyan';

  const handleCopy = () => {
    navigator.clipboard.writeText(rawValueToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`h-full bg-black/30 p-4 rounded-lg border border-white/5 flex flex-col justify-between items-start group transition-colors duration-300 ${isCyan ? 'hover:border-cyan-500/30' : 'hover:border-blue-500/30'}`}>
      <div className="flex justify-between w-full items-start mb-3 gap-2">
        <span className="text-[16px] opacity-90 font-bold truncate tracking-wide">{label}</span>
        {type !== 'unitless' && (
          <select 
            value={unit} 
            onChange={(e) => setUnit(e.target.value)}
            className={`font-bold bg-transparent text-[14px] outline-none cursor-pointer border-b appearance-none ${isCyan ? 'text-cyan-400 border-transparent hover:border-cyan-500' : 'text-blue-400 border-transparent hover:border-blue-500'}`}
            dir="ltr"
          >
            {Object.keys(units).map(u => (
              <option key={u} value={u} className="bg-slate-900">{u}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex justify-between w-full items-end gap-2" dir="ltr">
        <div className="flex-1 flex items-end mb-1">
          {equation && <span className={`text-[12px] font-mono opacity-60 ${isCyan ? 'text-cyan-200' : 'text-blue-200'}`}>{equation}</span>}
        </div>
        <div className="flex items-center">
          <span className={`text-2xl font-bold font-mono border-r border-white/10 pr-3 mr-2 ${isCyan ? 'text-cyan-300' : 'text-blue-300'}`}>{formattedValue}</span>
          <button 
            onClick={handleCopy}
            className={`p-2 rounded-md transition-all duration-300 flex items-center justify-center shrink-0 ${isCyan ? 'hover:bg-cyan-500/20 text-cyan-400' : 'hover:bg-blue-500/20 text-blue-400'} ${copied ? 'scale-110' : ''}`}
            title="نسخ الرقم"
          >
            {copied ? <Check className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_#4ade80]" /> : <Copy className="w-5 h-5 opacity-70 hover:opacity-100" />}
          </button>
        </div>
      </div>
    </div>
  );
}

type InputType = 'fcu' | 'fcPrime';

function ConcreteCalculator({ className }: { className?: string }) {
  const [inputType, setInputType] = useState<InputType>('fcu');
  const [inputUnit, setInputUnit] = useState<string>('MPa (N/mm²)');
  const [inputValue, setInputValue] = useState<string>('30');

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    const oldMult = STRESS_UNITS[inputUnit];
    const newMult = STRESS_UNITS[newUnit];
    
    if (inputValue) {
      const val = parseFloat(inputValue);
      if (!isNaN(val)) {
        const inMPa = val / oldMult;
        const newDisp = inMPa * newMult;
        setInputValue(Number(newDisp.toFixed(4)).toString());
      }
    }
    setInputUnit(newUnit);
  };

  const calcValues = useMemo(() => {
    const val = parseFloat(inputValue) || 0;
    const valInMPa = val / (STRESS_UNITS[inputUnit] || 1);

    const fcu = inputType === 'fcu' ? valInMPa : valInMPa / 0.8;
    const fcPrime = inputType === 'fcPrime' ? valInMPa : valInMPa * 0.8;
    
    const Ec = 4700 * Math.sqrt(fcPrime);
    const poisson = 0.2;
    const G = 0.43 * Ec;
    const fr = 0.62 * Math.sqrt(fcPrime);
    const density = 2.4;

    return { fcu, fcPrime, Ec, poisson, G, fr, density };
  }, [inputValue, inputType, inputUnit]);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className={`glass rounded-2xl p-6 neon-border flex flex-col ${className || ''}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <Box className="w-5 h-5 neon-text" />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-wider text-cyan-100">خواص الخرسانة</h2>
      </div>

      <div className="flex flex-col flex-1 space-y-4">
        <div className="flex flex-col justify-between items-start bg-black/20 p-4 rounded-lg border border-white/5 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[16px] font-bold opacity-90">رتبة الخرسانة ووحدة الإدخال</label>
            <span className="text-[12px] opacity-70 leading-relaxed font-medium">يرجى اختيار نوع الإجهاد الذي سيتم إدخاله سواء للمكعب أو الأسطوانة، مع تحديد الوحدة.</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full" dir="ltr">
            <select 
              value={inputType} 
              onChange={(e) => setInputType(e.target.value as InputType)}
              className="input-box w-[70px] !py-1 text-center font-bold text-sm bg-slate-900 border-none outline-none appearance-none text-cyan-300"
            >
              <option value="fcu">fcu</option>
              <option value="fcPrime">fc'</option>
            </select>
            <input 
              type="number" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="input-box !py-1 w-[100px] text-center font-mono neon-text outline-none"
              placeholder="30"
            />
            <select 
              value={inputUnit}
              onChange={handleUnitChange}
              className="input-box !py-1 text-center font-mono font-bold text-sm bg-slate-900 outline-none hover:border-cyan-500/50 appearance-none text-cyan-300 cursor-pointer"
            >
              {Object.keys(STRESS_UNITS).map(u => (
                <option key={u} value={u} className="bg-slate-900">{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-[1px] bg-cyan-500/20 my-5"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          <PropertyBox label={inputType === 'fcu' ? "المقاومة المميزة للأسطوانة (fc')" : "إجهاد الكسر للمكعب (fcu)"} valueBase={inputType === 'fcu' ? calcValues.fcPrime : calcValues.fcu} type="stress" themeColor="cyan" equation={inputType === 'fcu' ? "fc' = 0.8 fcu" : "fcu = fc' / 0.8"} forceUnit={inputUnit} />
          <PropertyBox label="معاير المرونة (Ec)" valueBase={calcValues.Ec} type="stress" themeColor="cyan" equation="Ec = 4700 √fc'" forceUnit={inputUnit} />
          <PropertyBox label="نسبة بواسون (ν)" valueBase={calcValues.poisson} type="unitless" decimals={2} themeColor="cyan" />
          <PropertyBox label="معاير القص (G)" valueBase={calcValues.G} type="stress" themeColor="cyan" equation="G = 0.43 Ec" forceUnit={inputUnit} />
          <PropertyBox label="معامل الشد (fr)" valueBase={calcValues.fr} type="stress" themeColor="cyan" equation="fr = 0.62 √fc'" forceUnit={inputUnit} />
          <PropertyBox label="كثافة الخرسانة (γ)" valueBase={calcValues.density} type="density" decimals={2} themeColor="cyan" />
        </div>
      </div>
    </motion.section>
  );
}

function RebarCalculator({ className }: { className?: string }) {
  const [inputUnit, setInputUnit] = useState<string>('MPa (N/mm²)');
  const [fy, setFy] = useState<string>('420');
  const [fu, setFu] = useState<string>('550');

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    const oldMult = STRESS_UNITS[inputUnit];
    const newMult = STRESS_UNITS[newUnit];
    
    if (fy) {
      const val = parseFloat(fy);
      if (!isNaN(val)) {
        setFy(Number(((val / oldMult) * newMult).toFixed(4)).toString());
      }
    }
    if (fu) {
      const val = parseFloat(fu);
      if (!isNaN(val)) {
        setFu(Number(((val / oldMult) * newMult).toFixed(4)).toString());
      }
    }
    setInputUnit(newUnit);
  };

  const calcValues = useMemo(() => {
    const Es = 200000;
    const poisson = 0.3;
    const G = Es / (2 * (1 + poisson));
    const density = 7.85;

    return { Es, poisson, G, density };
  }, []);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
      className={`glass rounded-2xl p-6 neon-border-blue flex flex-col ${className || ''}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Layers className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-wider text-blue-100">خواص حديد التسليح</h2>
      </div>

      <div className="flex flex-col flex-1 space-y-4">
        <div className="flex flex-col justify-between items-start bg-black/20 p-4 rounded-lg border border-white/5 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[16px] font-bold opacity-90">وحدة الإدخال</label>
            <span className="text-[12px] opacity-70 leading-relaxed font-medium">يرجى اختيار الوحدة لخصائص الحديد</span>
          </div>
          <div className="w-full flex justify-end" dir="ltr">
            <select 
              value={inputUnit}
              onChange={handleUnitChange}
              className="input-box !py-1 text-center font-mono font-bold text-sm bg-slate-900 outline-none hover:border-blue-500/50 appearance-none text-blue-300 cursor-pointer"
            >
              {Object.keys(STRESS_UNITS).map(u => (
                <option key={u} value={u} className="bg-slate-900">{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center px-2">
          <label className="text-sm opacity-70">إجهاد الخضوع (Fy)</label>
          <div className="flex items-center gap-2" dir="ltr">
            <input 
              type="number" 
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              className="input-box !py-1 w-[120px] text-center font-mono text-blue-300 border-blue-500/20 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] outline-none"
            />
          </div>
        </div>
        <div className="flex justify-between items-center px-2">
          <label className="text-sm opacity-70">إجهاد الكسر (Fu)</label>
          <div className="flex items-center gap-2" dir="ltr">
            <input 
              type="number" 
              value={fu}
              onChange={(e) => setFu(e.target.value)}
              className="input-box !py-1 w-[120px] text-center font-mono text-blue-300 border-blue-500/20 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] outline-none"
            />
          </div>
        </div>

        <div className="h-[1px] bg-blue-500/20 my-5"></div>

        <div className="grid grid-cols-1 gap-4 flex-1">
          <PropertyBox label="معاير المرونة (Es)" valueBase={calcValues.Es} type="stress" themeColor="blue" equation="200,000 MPa (N/mm²)" forceUnit={inputUnit} />
          <PropertyBox label="معاير القص (G)" valueBase={calcValues.G} type="stress" themeColor="blue" equation="G = Es / 2(1+v)" forceUnit={inputUnit} />
          <div className="grid grid-cols-2 gap-4">
            <PropertyBox label="كثافة الحديد (γ)" valueBase={calcValues.density} type="density" decimals={2} themeColor="blue" equation="7.85 T/m³" />
            <PropertyBox label="نسبة بواسون (ν)" valueBase={calcValues.poisson} type="unitless" decimals={2} themeColor="blue" equation="0.3" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function SocialLinks() {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-2xl p-5 border border-white/5 w-full mt-2"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <a 
          href="https://chat.whatsapp.com/K3wa7tug2OTDW0Tpb5CyGj" 
          target="_blank" rel="noopener noreferrer" 
          className="flex justify-center items-center gap-3 p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all duration-300 shadow-sm hover:shadow-[#25D366]/10"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#25D366] shadow-[0_0_8px_#25D366]"></div>
          <span className="text-[16px] text-green-100 font-bold tracking-wide">اقتراحات التطوير (واتساب)</span>
        </a>
        <a 
          href="https://t.me/AHMEDABOUKHEZAIMA" 
          target="_blank" rel="noopener noreferrer" 
          className="flex justify-center items-center gap-3 p-4 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/20 hover:bg-[#0088cc]/20 transition-all duration-300 shadow-sm hover:shadow-[#0088cc]/10"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#0088cc] shadow-[0_0_8px_#0088cc]"></div>
          <span className="text-[16px] text-sky-100 font-bold tracking-wide">أحدث الإصدارات (تليجرام)</span>
        </a>
        <a 
          href="https://beacons.ai/eng_ahmed_aboukhezaima" 
          target="_blank" rel="noopener noreferrer" 
          className="flex justify-center items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300 shadow-sm hover:shadow-purple-500/10"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]"></div>
          <span className="text-[16px] text-purple-100 font-bold tracking-wide">ميديا المطور (Media Kit)</span>
        </a>
      </div>
    </motion.section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen text-slate-200 p-4 md:p-8 font-sans overflow-x-hidden flex flex-col relative" dir="rtl">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col relative z-10 gap-6">
        
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row shadow-lg items-center justify-between gap-6 glass p-6 rounded-2xl neon-border"
        >
          <div className="text-center md:text-right flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-bold neon-text mb-2 drop-shadow-md">تم الإعداد بواسطة م/ أحمد علي أبوخزيمه</h1>
            <p className="text-[16px] text-cyan-400 tracking-wide font-bold">مطور أنظمة أتمتة إنشائية</p>
            <p className="text-[14px] text-slate-300 opacity-80 mt-1 font-medium">حساب خواص الخرسانة وحديد التسليح لمدخلات برامج (CSI Material Properties)</p>
          </div>

          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            {/* Dynamic animated borders */}
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-cyan-400 border-b-blue-600 animate-[spin_3s_linear_infinite] shadow-[0_0_15px_rgba(0,242,255,0.4)]"></div>
            <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-l-blue-400 border-r-cyan-300 animate-[spin_4s_linear_infinite_reverse] opacity-70"></div>
            <div className="absolute inset-3 rounded-full border border-cyan-500/30 animate-[ping_3s_ease-in-out_infinite]"></div>
            
            <div className="w-[84px] h-[84px] rounded-full bg-slate-800 border-2 border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.5)] flex justify-center items-center overflow-hidden relative z-10 shrink-0">
              <img 
                src="/developer_image.jpg" 
                alt="م/ أحمد أبوخزيمه" 
                className="w-full h-full object-cover relative z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Ahmed+Aboukhezaima&background=0284c7&color=fff';
                }}
              />
            </div>
          </div>
        </motion.header>

        {/* Main Content Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
          <ConcreteCalculator className="lg:col-span-7 h-full" />
          <RebarCalculator className="lg:col-span-5 h-full" />
        </main>

        <SocialLinks />

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10"
        >
          <div className="text-[10px] opacity-40 font-mono tracking-wider text-center md:text-right" dir="ltr">
            AUTOMATION PLATFORM // COPYRIGHT &copy; AHMED ABOUKHEZAIMA
          </div>
          <div className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold tracking-widest text-cyan-400 uppercase drop-shadow-sm font-mono leading-none" dir="ltr">
            App Version : 1.1
          </div>
        </motion.footer>

      </div>
    </div>
  );
}

