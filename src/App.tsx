import React, { useEffect, useMemo, useState } from 'react';
import localSnapshot from '../master-project-list.json';

type WhitelistDb = Record<string, { totalProjects: number; projects: string[] }>; 

const normalizeAddress = (value: string): string => value.trim();

const formatProjectName = (key: string): string => {
  if (key.startsWith('nft_')) return key.replace('nft_', '').toUpperCase() + ' NFT';
  if (key.startsWith('token_')) return key.replace('token_', '').toUpperCase() + ' TOKEN';
  return key;
};

const projectIconPath = (key: string): string | null => {
  const map: Record<string, string> = {
    nft_degen: '/dgn.png',
    nft_kjp: '/kjp.png',
    nft_pvamp: '/pv.png',
    token_xencat: '/xencat.png',
    token_solxen: '/solxen.png',
    token_drac: '/drac.png',
    root: '/root.png'
  };
  return map[key] ?? null;
};

const projectLinks: Record<string, { site?: string; x?: string }> = {
  nft_degen: { site: 'https://degen.fyi', x: 'https://x.com/degen_fyi' },
  nft_pvamp: { site: 'https://potatovampire.com', x: 'https://x.com/potatovampsol' },
  token_solxen: { site: 'https://solxen.io', x: 'https://x.com/XEN_Crypto' },
  nft_kjp: { site: 'https://noface.buzz', x: 'https://x.com/i/communities/1952895193478463919' },
  token_xencat: { site: 'https://xencat.tech', x: 'https://x.com/solxencat' },
  token_drac: { site: 'https://emojidracula.win', x: 'https://x.com/EmojiDracula' },
  root: { site: 'https://treeroot.city', x: 'https://x.com/treerootdev' }
};

const useLookup = (db: WhitelistDb, wallet: string) => {
  return useMemo(() => {
    const address = normalizeAddress(wallet);
    if (!address) return null;
    const entry = db[address];
    if (!entry) return { address, total: 0, projects: [] as string[] };
    return { address, total: entry.totalProjects, projects: entry.projects };
  }, [db, wallet]);
};

const AnimatedDivider: React.FC = () => <div className="divider" aria-hidden="true" />;

const App: React.FC = () => {
  const [db, setDb] = useState<WhitelistDb>(localSnapshot as WhitelistDb);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wallet, setWallet] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const result = useLookup(db, query);
  const [tab, setTab] = useState<'lookup' | 'about'>('lookup');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const base = import.meta.env.BASE_URL || '/';
        const res = await fetch(`${base}master-project-list.json`, { cache: 'no-cache' });
        const json = (await res.json()) as WhitelistDb;
        setDb(json);
      } catch (err) {
        console.error('Failed to load master-project-list.json', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();

    const params = new URLSearchParams(window.location.search);
    const q = params.get('wallet');
    if (q) {
      setWallet(q);
      setQuery(q);
    }
  }, []);

  const onSearch = () => {
    const next = normalizeAddress(wallet);
    setQuery(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set('wallet', next); else url.searchParams.delete('wallet');
    window.history.replaceState({}, '', url);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="scanlines">
      <div className="container">
        <h1 className="title">TREEROOT.CITY</h1>
        <div className="subtitle">STAY ROOTED. GROW TOGETHER.<span className="cursorLine" /></div>

        <div className="panel">
          <div className="tabs">
            <button className={`tabBtn ${tab === 'lookup' ? 'active' : ''}`} onClick={() => setTab('lookup')}>Lookup</button>
            <button className={`tabBtn ${tab === 'about' ? 'active' : ''}`} onClick={() => setTab('about')}>About</button>
          </div>
          {tab === 'lookup' && (
          <>
          <div className="inputRow">
            <input
              type="text"
              inputMode="text"
              placeholder="Enter Solana wallet address"
              aria-label="Wallet address"
              spellCheck={false}
              value={wallet}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWallet(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button className="btn" onClick={onSearch}>Search</button>
          </div>
          <AnimatedDivider />
          <div className="results">
            {isLoading && <div className="muted">Loading snapshot…</div>}
            {!isLoading && !result && <div className="muted">Awaiting input…</div>}
            {result && result.total === 0 && (
              <div className="danger">No whitelist entries found for {result.address}</div>
            )}
            {result && result.total > 0 && (
              <div>
                <div style={{ marginBottom: 10 }}>
                  <strong style={{ color: 'var(--primary)' }}>Address:</strong> {result.address}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <strong style={{ color: 'var(--primary)' }}>Total WL:</strong> {result.total}
                </div>
                <div className="grid">
                  {result.projects.map((p) => {
                    const icon = projectIconPath(p);
                    return (
                      <div key={p} className="card">
                        <div className="projHeader">
                          {icon && (
                            <img
                              className="projIcon"
                              src={icon}
                              alt={formatProjectName(p)}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/root.png'; }}
                            />
                          )}
                          <div>
                            <div><strong>Project</strong>: {formatProjectName(p)}</div>
                            <div className="muted">One WL</div>
                            {(projectLinks[p]?.site || projectLinks[p]?.x) && (
                              <div className="linksRow">
                                {projectLinks[p]?.site && (
                                  <a href={projectLinks[p].site} target="_blank" rel="noreferrer">Website</a>
                                )}
                                {projectLinks[p]?.x && (
                                  <a href={projectLinks[p].x} target="_blank" rel="noreferrer">X</a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          </>
          )}
          {tab === 'about' && (
            <div className="section">
              <h3>Root Guardian NFT Collection</h3>
              <div className="monoBox muted">
                888 Root Guardian NFTs on Solana serving as membership tokens with access to a one-time private staking pool. 50,000,000 $ROOT (5% of total supply) is allocated to holders; each NFT earns 777 $ROOT daily until the pool depletes.
              </div>

              <h3>Mint Structure</h3>
              <ul>
                <li><strong>Phase 1</strong>: ROOT holders — 400 NFTs, free, 2 per wallet, 1 week.</li>
                <li><strong>Phase 2</strong>: Partner communities — 400 NFTs, free, FCFS, 1 per wallet, 1 week.</li>
                <li><strong>Phase 3</strong>: Public — 88 NFTs (+ leftovers), 0.05 SOL, 1 per wallet.</li>
              </ul>

              <h3>Partner Community Snapshot</h3>
              <table className="table">
                <thead>
                  <tr><th>Community</th><th>Addresses</th></tr>
                </thead>
                <tbody>
                  <tr><td>Degen Skull NFT</td><td>196</td></tr>
                  <tr><td>No-Face $KJP NFT</td><td>94</td></tr>
                  <tr><td>Potato Vampire NFT</td><td>77</td></tr>
                  <tr><td>XenCat token ($100+)</td><td>330</td></tr>
                  <tr><td>SolXen token ($100+)</td><td>274</td></tr>
                  <tr><td>EmojiDracula token ($100+)</td><td>164</td></tr>
                </tbody>
              </table>

              <h3>Cross-Community Participation</h3>
              <table className="table">
                <thead>
                  <tr><th>Projects Held</th><th>Addresses</th></tr>
                </thead>
                <tbody>
                  <tr><td>5 projects</td><td>2</td></tr>
                  <tr><td>4 projects</td><td>8</td></tr>
                  <tr><td>3 projects</td><td>34</td></tr>
                  <tr><td>2 projects</td><td>157</td></tr>
                  <tr><td>1 project</td><td>~800</td></tr>
                </tbody>
              </table>

              <h3>Staking</h3>
              <ul>
                <li>Begins after mint completion</li>
                <li>777 $ROOT daily per NFT</li>
                <li>No lock-up, auto distribution until pool depletes</li>
              </ul>

              <h3>Connect</h3>
              <div className="social">
                <a href="https://pump.fun/coin/J7hX5qVuJuiUiuZ1AkqE7eVS3sjTJ5kgFnuJwR2Rpump" target="_blank" rel="noreferrer">Pump.fun</a>
                <a href="https://t.me/TreeRootCity" target="_blank" rel="noreferrer">Telegram</a>
                <a href="https://x.com/i/communities/1951722418839458072" target="_blank" rel="noreferrer">X Community</a>
                <a href="https://x.com/TreeRootDev" target="_blank" rel="noreferrer">Dev</a>
                <a href="https://youtube.com/treecitywes" target="_blank" rel="noreferrer">YouTube</a>
                <a href="https://dexscreener.com/solana/4LDHt1EqW8UuRh9954t5j7KMCFdTu6XgSPuaNKccXHHm" target="_blank" rel="noreferrer">DexScreener</a>
                <a href="https://treeroot-city.gitbook.io/litepaper/" target="_blank" rel="noreferrer">GitBook</a>
              </div>

              <div className="muted" style={{ marginTop: 8 }}>
                Full details: <a href="https://treeroot-city.gitbook.io/litepaper/root-guardian-nft-collection" target="_blank" rel="noreferrer">Litepaper</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;


