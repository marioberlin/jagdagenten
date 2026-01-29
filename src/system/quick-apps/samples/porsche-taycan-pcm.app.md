---
name: Porsche Taycan PCM
version: 0.3.0
icon: Car
description: Pixel-perfect replica of the Porsche Taycan PCM infotainment with authentic app tiles, navigation, and media screens.
author: LiquidOS
category: lifestyle
tags: [automotive, porsche, infotainment, navigation, media, taycan]
size: [1024, 393]
window: floating
---

```tsx App
export default function App() {
  const [screen, setScreen] = useStorage('screen', 'home')
  const [mediaView, setMediaView] = useStorage('mediaView', 'play')

  // Porsche color scheme from reference
  const colors = {
    bg: '#0f0f0f',
    surface: '#1a1a1a',
    tile: '#1f1f1f',
    cyan: '#00b4d8',
    text: '#ffffff',
    textSec: 'rgba(255,255,255,0.6)',
  }

  // Asset base path
  const assets = '/assets/porsche-pcm'

  // App definitions matching reference exactly
  const apps = [
    { id: 'nav', img: `${assets}/nav.png`, click: () => setScreen('nav') },
    { id: 'media', img: `${assets}/media.png`, click: () => setScreen('media') },
    { id: 'vehicle', img: `${assets}/vehicle.png` },
    { id: 'phone', img: `${assets}/phone.png` },
    { id: 'homelink', img: `${assets}/homelink.png` },
    { id: 'climate', img: `${assets}/climate.png` },
    { id: 'notifications', img: `${assets}/notifications.png` },
    { id: 'devices', img: `${assets}/devices.png` },
    { id: 'carplay', img: `${assets}/carplay.png` },
    { id: 'charging', img: `${assets}/charging.png` },
    { id: 'android', img: `${assets}/android.png` },
    { id: 'settings', img: `${assets}/settings.png` },
  ]

  // Container style - full reference aspect ratio
  const containerStyle = {
    display: 'flex',
    width: '100%',
    height: '100%',
    background: colors.bg,
    color: colors.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: 'hidden',
  }

  // Sidebar style matching reference
  const sidebarStyle = {
    width: '55px',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    paddingTop: '10px',
    gap: '8px',
    borderRight: '1px solid rgba(255,255,255,0.05)',
  }

  // Sidebar button
  const SidebarBtn = ({ active, img, onClick }: { active?: boolean; img: string; onClick?: () => void }) => (
    <button
      onClick={onClick}
      style={{
        width: '44px',
        height: '44px',
        padding: '8px',
        background: active ? 'rgba(0,180,216,0.15)' : 'transparent',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img src={img} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
    </button>
  )

  // Home Screen
  const HomeScreen = () => (
    <div style={{ flex: 1, padding: '15px 20px', display: 'flex', flexDirection: 'column' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} style={{ color: colors.textSec }} />
          <span style={{ color: colors.textSec, fontSize: '16px' }}>Search</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textSec, fontSize: '13px' }}>
            <MapPin size={14} />
            <span>Area West Marketing</span>
            <ChevronDown size={14} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '300', letterSpacing: '2px' }}>
            <span style={{ fontWeight: '600' }}>9:11</span>
            <span style={{ fontSize: '12px', marginLeft: '4px', color: colors.textSec }}>AM</span>
          </div>
        </div>
      </div>

      {/* App grid - matching reference 6 columns */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(6, 100px)', 
        gap: '15px',
        justifyContent: 'start',
      }}>
        {apps.map(app => (
          <button
            key={app.id}
            onClick={app.click}
            style={{
              width: '100px',
              height: '120px',
              background: 'none',
              border: 'none',
              cursor: app.click ? 'pointer' : 'default',
              padding: 0,
            }}
          >
            <img 
              src={app.img} 
              alt="" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                borderRadius: '12px',
              }} 
            />
          </button>
        ))}
      </div>
    </div>
  )

  // Navigation Screen
  const NavScreen = () => (
    <div style={{ flex: 1, display: 'flex', height: '100%' }}>
      {/* Left panel */}
      <div style={{ width: '320px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', padding: '5px' }}>
            <ChevronLeft size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
            <Search size={16} style={{ color: colors.textSec }} />
            <span style={{ color: colors.textSec, fontSize: '14px' }}>Search</span>
          </div>
          <Mic size={20} style={{ color: colors.textSec }} />
          <MapPin size={20} style={{ color: colors.textSec }} />
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {[MapPin, Star, Fuel, Route, MoreHorizontal].map((Icon, i) => (
            <div key={i} style={{ padding: '6px', color: i === 0 ? colors.cyan : colors.textSec, borderBottom: i === 0 ? `2px solid ${colors.cyan}` : 'none' }}>
              <Icon size={18} />
            </div>
          ))}
        </div>

        {/* Destinations */}
        <div style={{ flex: 1 }}>
          {[
            { icon: Home, name: 'Home', addr: 'Add address' },
            { icon: Star, name: 'Work', addr: 'Add address' },
            { icon: MapPin, name: 'Golden Gate Bridge', addr: 'Golden Gate Bridge, San Francisco 94129-9000' },
            { icon: MapPin, name: 'Disneyland', addr: 'Anaheim, CA 92802, USA' },
          ].map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
              <d.icon size={18} style={{ color: colors.textSec, flexShrink: 0 }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{d.name}</div>
                <div style={{ fontSize: '12px', color: colors.textSec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.addr}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map placeholder */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #2d4a3e 0%, #1a3028 50%, #243a30 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: colors.textSec }}>
          <Globe size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
          <div style={{ fontSize: '14px' }}>Satellite Map View</div>
        </div>
      </div>
    </div>
  )

  // Media Screen  
  const MediaScreen = () => (
    <div style={{ flex: 1, padding: '15px 20px', display: 'flex', flexDirection: 'column' }}>
      {/* Header tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '25px' }}>
          {['Play', 'List'].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setMediaView(tab.toLowerCase())}
              style={{
                background: 'none',
                border: 'none',
                color: (mediaView === tab.toLowerCase() || (i === 0 && mediaView === 'play')) ? colors.cyan : colors.textSec,
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                paddingBottom: '8px',
                borderBottom: (mediaView === tab.toLowerCase() || (i === 0 && mediaView === 'play')) ? `2px solid ${colors.cyan}` : 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', color: colors.textSec }}>BOSE</div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flex: 1 }}>
        {/* Left - controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Source icons */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            {[Music, Radio, Music2, Music3, MoreHorizontal].map((Icon, i) => (
              <div key={i} style={{ padding: '8px', borderRadius: '8px', background: i === 1 ? 'rgba(0,180,216,0.15)' : 'transparent', color: i === 1 ? colors.cyan : colors.textSec }}>
                <Icon size={20} />
              </div>
            ))}
          </div>

          {/* Now playing */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: colors.cyan }}>Ch 7 - 70s on 7</div>
            <div style={{ fontSize: '14px', color: colors.textSec, marginTop: '4px' }}>Electric Light Orchestra</div>
            <div style={{ fontSize: '14px', color: colors.textSec }}>Livin' Thing (76)</div>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', color: colors.cyan, marginBottom: '6px' }}>Live</div>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px' }}>
              <div style={{ width: '65%', height: '100%', background: colors.cyan, borderRadius: '2px' }} />
            </div>
          </div>

          {/* Transport */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <SkipBack size={22} style={{ color: colors.textSec, cursor: 'pointer' }} />
            <div style={{ 
              width: '45px', height: '45px', borderRadius: '50%', 
              background: 'rgba(255,255,255,0.1)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
            }}>
              <Pause size={22} style={{ color: colors.text }} />
            </div>
            <SkipForward size={22} style={{ color: colors.textSec, cursor: 'pointer' }} />
          </div>
        </div>

        {/* Right - album art */}
        <div style={{ 
          width: '180px', height: '180px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #5c3a8a 0%, #2a1a4a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}>
          <Music size={60} style={{ color: 'rgba(255,255,255,0.3)' }} />
        </div>
      </div>
    </div>
  )

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <SidebarBtn active={screen === 'home'} img={`${assets}/sidebar-home.png`} onClick={() => setScreen('home')} />
        <SidebarBtn active={screen === 'nav'} img={`${assets}/sidebar-nav.png`} onClick={() => setScreen('nav')} />
        <SidebarBtn active={screen === 'media'} img={`${assets}/sidebar-media.png`} onClick={() => setScreen('media')} />
        <SidebarBtn img={`${assets}/sidebar-phone.png`} />
        <SidebarBtn img={`${assets}/sidebar-car.png`} />
      </div>

      {/* Main content */}
      {screen === 'home' && <HomeScreen />}
      {screen === 'nav' && <NavScreen />}
      {screen === 'media' && <MediaScreen />}
    </div>
  )
}
```
