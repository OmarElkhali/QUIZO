import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { languages } from '@/i18n/config';
import { useEffect } from 'react';

export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  // Apply RTL for Arabic
  useEffect(() => {
    const currentLang = languages.find(lang => lang.code === i18n.language);
    if (currentLang && 'rtl' in currentLang && currentLang.rtl) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = currentLang.code;
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2 hover:bg-white/5 text-[#d8d2ce] hover:text-white transition-all duration-300">
          <Globe className="h-4 w-4 text-[#ffb77d]" />
          <img
            src={`https://flagcdn.com/w40/${currentLanguage.countryCode}.png`}
            srcSet={`https://flagcdn.com/w80/${currentLanguage.countryCode}.png 2x`}
            width="18"
            height="13"
            alt={currentLanguage.name}
            className="rounded-[2px] shadow-sm object-cover border border-white/10 shrink-0"
          />
          <span className="hidden md:inline text-xs font-semibold text-[#a79d96]">{currentLanguage.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-white/[0.07] bg-[#181818]/95 backdrop-blur-md shadow-2xl">
        <div className="px-2 py-1.5 text-xs font-semibold text-[#a79d96] uppercase tracking-wider">
          Select Language / Choisir la langue
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-white/5 focus:bg-white/5 ${
              i18n.language === language.code ? 'bg-white/5 text-[#ffb77d]' : 'text-white'
            }`}
          >
            <img
              src={`https://flagcdn.com/w40/${language.countryCode}.png`}
              srcSet={`https://flagcdn.com/w80/${language.countryCode}.png 2x`}
              width="18"
              height="13"
              alt={language.name}
              className="rounded-[2px] shadow-sm object-cover border border-white/10 shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-white group-hover:text-[#ffb77d]">{language.nativeName}</span>
              <span className="text-[10px] text-[#a79d96]">{language.name}</span>
            </div>
            {i18n.language === language.code && (
              <span className="ml-auto text-xs text-[#ffb77d] font-bold">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
