import React from 'react';
import { Wrench } from 'lucide-react';
import { useGarage } from '../../context/GarageContext';
import logoImg from '../../assets/images/logo.png';

interface LoginLogoProps {
  heading?: string;
  subtitle?: string;
}

export const LoginLogo: React.FC<LoginLogoProps> = ({
  heading = 'Welcome back.',
  subtitle = 'Your workshop, connected.',
}) => {
  const { systemSettings } = useGarage();

  const logoUrl =
    systemSettings?.garageInfo?.logoUrl && !systemSettings.garageInfo.logoUrl.includes('unsplash.com')
      ? systemSettings.garageInfo.logoUrl
      : logoImg;

  return (
    <div className="mb-8">
      {/* Brand Icon & Tracking Label */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center shadow-xs overflow-hidden">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="w-full h-full object-contain p-1.5"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.login-logo-placeholder');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`login-logo-placeholder ${logoUrl ? 'hidden' : 'flex'} w-full h-full bg-[#111111] text-white items-center justify-center font-bold`}
            aria-hidden="true"
          >
            <Wrench className="w-5 h-5 stroke-[2] text-[#10B981]" />
          </div>
        </div>

        <div>
          <span className="block font-mono text-[10px] font-bold tracking-[0.22em] text-slate-500 uppercase">
            GARAGE MANAGEMENT SYSTEM
          </span>
          <span className="text-xs font-semibold text-[#111111]">
            APEX AUTOMOTIVE
          </span>
        </div>
      </div>

      {/* Main Heading */}
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111111]">
        {heading}
      </h1>

      {/* Subtitle */}
      <p className="text-sm text-slate-500 mt-2 font-normal">
        {subtitle}
      </p>
    </div>
  );
};
