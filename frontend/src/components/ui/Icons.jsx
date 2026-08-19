function Svg({ children, size = 20, className = "", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (props) => (
  <Svg {...props}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 001 1h11a1 1 0 001-1v-9" />
    <path d="M9.5 20v-5.5a1 1 0 011-1h3a1 1 0 011 1V20" />
  </Svg>
);

export const ChartIcon = (props) => (
  <Svg {...props}>
    <path d="M4 20V10M12 20V4M20 20v-7" />
    <path d="M2.5 20h19" />
  </Svg>
);

export const UsersIcon = (props) => (
  <Svg {...props}>
    <circle cx="9" cy="8" r="3.25" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M15.5 3.75c1.7.3 3 1.8 3 3.6s-1.3 3.3-3 3.6" />
    <path d="M16.75 14.25c2.65.5 4.75 2.5 4.75 5.75" />
  </Svg>
);

export const MessageIcon = (props) => (
  <Svg {...props}>
    <path d="M4 4.5h16a1 1 0 011 1v10.5a1 1 0 01-1 1H9l-4.5 4v-4H4a1 1 0 01-1-1V5.5a1 1 0 011-1z" />
  </Svg>
);

export const UserIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" />
  </Svg>
);

export const SettingsIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V19.5a2 2 0 11-4 0v-.1a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H4.5a2 2 0 110-4h.1a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H10a1.65 1.65 0 001-1.51V4.5a2 2 0 114 0v.1a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V10c.36.36.86.86 1.51 1H19.5a2 2 0 110 4h-.1a1.65 1.65 0 00-1.51 1z" />
  </Svg>
);

export const MoreIcon = (props) => (
  <Svg {...props}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
);

export const SunIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4.25" />
    <path d="M12 2.5v2.25M12 19.25v2.25M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.25M19.25 12h2.25M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
  </Svg>
);

export const MoonIcon = (props) => (
  <Svg {...props}>
    <path d="M20.5 14.2A8.5 8.5 0 119.8 3.5a7 7 0 0010.7 10.7z" />
  </Svg>
);

export const LockIcon = (props) => (
  <Svg {...props}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 118 0v3" />
  </Svg>
);

export const CheckIcon = (props) => (
  <Svg {...props}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Svg>
);

export const XIcon = (props) => (
  <Svg {...props}>
    <path d="M5 5l14 14M19 5L5 19" />
  </Svg>
);

export const PlusIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const ArrowRightIcon = (props) => (
  <Svg {...props}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Svg>
);

export const LogoutIcon = (props) => (
  <Svg {...props}>
    <path d="M9 20H5.5a1.5 1.5 0 01-1.5-1.5v-13A1.5 1.5 0 015.5 4H9" />
    <path d="M16.5 16l4-4-4-4M20 12H9" />
  </Svg>
);

export const SendIcon = (props) => (
  <Svg {...props}>
    <path d="M4 20l16.5-8L4 4l0 6.5L15 12 4 13.5z" />
  </Svg>
);

export const ShieldIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3l7 3v5.5c0 4.7-3 8.4-7 9.5-4-1.1-7-4.8-7-9.5V6l7-3z" />
    <path d="M9 12l2 2 4-4.5" />
  </Svg>
);

export const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M4.5 7h15M9.5 7V5a1 1 0 011-1h3a1 1 0 011 1v2m3 0-.8 12.1a2 2 0 01-2 1.9H9.3a2 2 0 01-2-1.9L6.5 7" />
  </Svg>
);

export const StarIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6-4.3-4.2 5.9-.8z" />
  </Svg>
);

export const SearchIcon = (props) => (
  <Svg {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-4.5-4.5" />
  </Svg>
);

export const ChevronLeftIcon = (props) => (
  <Svg {...props}>
    <path d="M14.5 5l-7 7 7 7" />
  </Svg>
);
