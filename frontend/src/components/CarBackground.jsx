import React from 'react';

export const CarBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Subtle radial ambient glows in Alice Blue tones */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-alice-300/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 -left-40 w-80 h-80 bg-alice-400/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-alice-200/5 rounded-full blur-3xl" />

      {/* Modern High-End Sports Car Silhouette & Aerodynamic Lines */}
      <svg
        className="absolute right-0 bottom-0 w-full max-w-4xl opacity-[0.07] text-alice-100"
        viewBox="0 0 1200 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Speed Streamlines */}
        <path d="M50 380 Q 300 380, 550 370 T 1150 370" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" />
        <path d="M120 360 Q 400 360, 680 340 T 1180 330" stroke="currentColor" strokeWidth="1.5" />
        <path d="M200 340 Q 520 330, 800 300 T 1100 290" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />

        {/* Aerodynamic GT Coupe Silhouette */}
        <path
          d="M 180 380 
             C 210 370, 240 340, 270 340 
             C 320 340, 360 365, 410 380 
             L 760 380 
             C 790 360, 830 340, 880 340 
             C 930 340, 970 365, 1000 380 
             L 1100 380 
             C 1120 360, 1140 320, 1080 300 
             C 980 270, 920 250, 850 210 
             C 750 150, 620 140, 520 160 
             C 410 180, 310 240, 230 290 
             C 170 330, 140 370, 180 380 Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Roofline & Window Canopy */}
        <path
          d="M 440 230 
             C 530 170, 640 160, 750 210 
             L 810 240 
             C 730 250, 590 255, 440 230 Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Front Splitter & Headlight Accent */}
        <path d="M 1080 300 L 1120 310" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
        <circle cx="1060" cy="295" r="4" fill="#38bdf8" />
        
        {/* Wheels outline */}
        <circle cx="340" cy="380" r="42" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" />
        <circle cx="340" cy="380" r="15" stroke="currentColor" strokeWidth="2" />
        <circle cx="940" cy="380" r="42" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" />
        <circle cx="940" cy="380" r="15" stroke="currentColor" strokeWidth="2" />
      </svg>

      {/* Secondary Top-Left Subtle Automotive Sketch Line */}
      <svg
        className="absolute -top-10 -left-10 w-96 opacity-[0.04] text-alice-200 transform -rotate-12"
        viewBox="0 0 500 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20 160 C 100 80, 300 40, 480 140" stroke="currentColor" strokeWidth="3" />
        <path d="M80 170 C 180 100, 340 70, 440 150" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
      </svg>
    </div>
  );
};
