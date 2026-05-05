import React from 'react'
import { User, Bell, PlusCircle, Search, Settings, Menu } from 'lucide-react'

const Header = ({ activeTab, setActiveTab, user, onNewReport, onOpenSidebar }) => {
  return (
    <header className="h-16 border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-4">
         <button 
           onClick={onOpenSidebar}
           className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
         >
           <Menu size={20} />
         </button>
         <h1 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">
            {activeTab === 'feed' && 'Market Intelligence'}
            {activeTab === 'analysis' && 'Intelligence Lab'}
            {activeTab === 'trends' && 'Global Trends'}
            {activeTab === 'saved' && 'Reading List'}
         </h1>
      </div>

      <div className="flex items-center gap-6">
         {/* User Profile */}
         <button className="flex items-center gap-3 group">
            <div className="text-right hidden sm:block">
               <div className="text-[10px] font-black text-white uppercase tracking-widest">{user?.name || user?.email?.split('@')[0] || 'Guest User'}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tp-accent to-tp-indigo p-[1px]">
               <div className="w-full h-full rounded-lg bg-[#0f0f0f] flex items-center justify-center text-tp-accent font-black text-[10px] group-hover:bg-tp-accent/10 transition-colors">
                  {user?.email?.[0]?.toUpperCase() || <User size={14} />}
               </div>
            </div>
         </button>
      </div>
    </header>
  )
}

export default Header
