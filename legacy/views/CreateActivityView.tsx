import React, { useState, useEffect } from 'react';
import { ArrowLeft, Rocket, Upload, Link as LinkIcon, Check, X } from 'lucide-react';
import { ActivityCategory } from '../types';
import * as DataService from '../services/dataService';
import { useLanguage } from '../contexts/LanguageContext';

interface CreateActivityViewProps {
  onClose: () => void;
}

const CreateActivityView: React.FC<CreateActivityViewProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    category: '' as ActivityCategory | '',
    title: '',
    description: '',
    infoUrl: '',
    isPublic: false,
    agreed: false
  });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
        const c = await DataService.getAllCategories();
        setCategories(c);
    };
    fetchCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? customCategoryInput.trim().toUpperCase() : formData.category;

    if (!finalCategory || !formData.title || !formData.agreed) return;

    setLoading(true);
    await DataService.createActivity({
        id: Date.now().toString(), // Temp ID, server generates UUID
        category: finalCategory as ActivityCategory,
        title: formData.title,
        description: formData.description,
        infoUrl: formData.infoUrl,
        iconName: 'Star', 
        thumbsUpCount: 0,
        thumbsDownCount: 0,
        lastShownAt: null
    });
    
    await DataService.addLog({
        timestamp: Date.now(),
        type: 'happypause_created',
        activityName: formData.title,
        category: finalCategory as ActivityCategory
    });

    setLoading(false);
    onClose();
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'NEW_CATEGORY_OPTION') {
          setIsCustomCategory(true);
          setFormData({ ...formData, category: '' });
      } else {
          setIsCustomCategory(false);
          setFormData({ ...formData, category: val });
      }
  };

  const cancelCustomCategory = () => {
      setIsCustomCategory(false);
      setCustomCategoryInput('');
      setFormData({ ...formData, category: '' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal text-offWhite flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="flex items-center justify-between px-6 py-6 border-b border-white/5 bg-charcoal/90 backdrop-blur">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
            <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">{t('create_happypause')}</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8 max-w-md mx-auto">
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-sage uppercase tracking-widest ml-1">{t('category')}</label>
                {!isCustomCategory ? (
                    <div className="relative">
                        <select 
                            required
                            className="w-full h-14 px-5 rounded-xl border-2 border-sage/30 bg-sage/5 text-offWhite focus:border-sage outline-none appearance-none"
                            value={formData.category}
                            onChange={handleCategoryChange}
                            style={{ colorScheme: 'dark' }} 
                        >
                            <option value="" disabled className="bg-charcoal text-offWhite">{t('select_category')}</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat} className="bg-charcoal text-offWhite">{t(cat)}</option>
                            ))}
                            <option value="NEW_CATEGORY_OPTION" className="font-bold text-sage bg-charcoal">{t('create_new')}</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input 
                            autoFocus
                            type="text"
                            placeholder={t('type_new_category')}
                            className="flex-1 h-14 px-5 rounded-xl border-2 border-sage bg-sage/5 text-offWhite placeholder:text-offWhite/30 focus:outline-none uppercase"
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                        />
                        <button 
                            type="button" 
                            onClick={cancelCustomCategory}
                            className="w-14 h-14 rounded-xl border-2 border-red-400/30 text-red-400 hover:bg-red-400/10 flex items-center justify-center transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-sage uppercase tracking-widest ml-1">{t('happypause_name')}</label>
                <input 
                    required
                    type="text"
                    placeholder="e.g., Morning Zen Flow"
                    className="w-full h-14 px-5 rounded-xl border-2 border-sage/30 bg-sage/5 text-offWhite placeholder:text-offWhite/30 focus:border-sage outline-none"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-sage uppercase tracking-widest ml-1">{t('description')}</label>
                <textarea 
                    rows={4}
                    placeholder="Describe your ritual..."
                    className="w-full p-5 rounded-xl border-2 border-sage/30 bg-sage/5 text-offWhite placeholder:text-offWhite/30 focus:border-sage outline-none resize-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-sage uppercase tracking-widest ml-1">{t('icon')}</label>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-sage/40 bg-sage/5 hover:border-sage cursor-pointer transition group">
                    <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center text-sage group-hover:scale-110 transition">
                        <Upload size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">{t('upload_icon')}</p>
                        <p className="text-xs text-offWhite/40">{t('png_jpg_hint')}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-sage uppercase tracking-widest ml-1">{t('info_link')}</label>
                <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-offWhite/30" size={18} />
                    <input 
                        type="url"
                        placeholder="https://example.com"
                        className="w-full h-14 pl-12 pr-5 rounded-xl border-2 border-sage/30 bg-sage/5 text-offWhite placeholder:text-offWhite/30 focus:border-sage outline-none"
                        value={formData.infoUrl}
                        onChange={e => setFormData({...formData, infoUrl: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`mt-1 w-5 h-5 rounded border border-sage flex items-center justify-center ${formData.isPublic ? 'bg-sage text-charcoal' : 'bg-transparent'}`}>
                        {formData.isPublic && <Check size={14} strokeWidth={4} />}
                    </div>
                    <input type="checkbox" className="hidden" checked={formData.isPublic} onChange={e => setFormData({...formData, isPublic: e.target.checked})} />
                    <span className="text-sm text-offWhite/70 group-hover:text-sage transition">{t('make_public')}</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`mt-1 w-5 h-5 rounded border border-sage flex items-center justify-center ${formData.agreed ? 'bg-sage text-charcoal' : 'bg-transparent'}`}>
                        {formData.agreed && <Check size={14} strokeWidth={4} />}
                    </div>
                    <input type="checkbox" className="hidden" checked={formData.agreed} onChange={e => setFormData({...formData, agreed: e.target.checked})} />
                    <span className="text-sm text-offWhite/70 group-hover:text-sage transition">{t('agree_terms')}</span>
                </label>
            </div>

            <button 
                type="submit"
                disabled={loading || !formData.agreed || !formData.title || (isCustomCategory ? !customCategoryInput.trim() : !formData.category)}
                className="w-full h-16 bg-sage disabled:opacity-50 disabled:cursor-not-allowed text-charcoal font-extrabold text-lg uppercase tracking-widest rounded-xl shadow-[0_4px_20px_rgba(177,183,162,0.3)] hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
                {loading ? t('loading') : t('add_submit')} <Rocket size={20} />
            </button>

            <div className="h-10" />
        </form>
      </main>
    </div>
  );
};

export default CreateActivityView;