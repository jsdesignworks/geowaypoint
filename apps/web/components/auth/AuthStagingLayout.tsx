import { GeoWaypointMark } from '@/components/shell/GeoWaypointMark';

type AuthStagingLayoutProps = {
  children: React.ReactNode;
  /** Page title inside card (serif heading) */
  title: string;
  subtitle?: string;
  /** Use slightly smaller title (signup / forgot) */
  titleSize?: 'lg' | 'sm';
  /** Wider card for signup fields */
  wideCard?: boolean;
};

/** Staging #v-login chrome — grove backdrop, grid, glow, elevated card */
export function AuthStagingLayout({
  children,
  title,
  subtitle,
  titleSize = 'lg',
  wideCard = false,
}: AuthStagingLayoutProps) {
  const showDevPill = process.env.NODE_ENV === 'development';

  return (
    <div className="gw-auth-root">
      <div className="gw-auth-glow" aria-hidden />
      <div className={`gw-login-card${wideCard ? ' gw-login-card-wide' : ''}`}>
        <div className="gw-brand">
          <div className="gw-brand-mark">
            <GeoWaypointMark size={22} />
          </div>
          <div>
            <span className="gw-brand-name">
              GeoWaypoint
              {showDevPill ? <span className="gw-brand-env">Staging</span> : null}
            </span>
          </div>
        </div>
        <h1
          className={`gw-login-h${titleSize === 'sm' ? ' gw-login-h-sm' : ''}${subtitle ? '' : ' gw-login-h-no-sub'}`}
        >
          {title}
        </h1>
        {subtitle ? <p className="gw-login-sub">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  );
}
