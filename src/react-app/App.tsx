import { useState, useEffect } from "react";

import Modal from "./components/Modal";
import "./App.css";

interface GuestbookEntry {
  name: string;
  message: string;
  timestamp: number;
}

function App() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");

  useEffect(() => {
    fetch("/api/guestbook")
      .then(res => res.json())
      .then(data => setEntries(data))
      .catch(() => setEntries([]));
  }, []);

  const addEntry = async () => {
    if (!guestName.trim() || !guestMessage.trim()) return;
    
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guestName, message: guestMessage })
      });
      
      const newEntry = await response.json();
      setEntries([...entries, newEntry]);
      setGuestName("");
      setGuestMessage("");
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
  };

  const lyrics = {
    track1: '[Verse 1]<br>Lorem ipsum dolor sit amet, consectetur adipiscing elit<br>Sed do eiusmod tempor incididunt ut labore et dolore magna<br><br>[Chorus]<br>Aliqua ut enim ad minim veniam, quis nostrud exercitation<br>Ullamco laboris nisi ut aliquip ex ea commodo consequat',
    track2: '[Verse 1]<br>Occaecat cupidatat non proident, sunt in culpa qui officia<br>Deserunt mollit anim id est laborum sed ut perspiciatis<br><br>[Chorus]<br>Unde omnis iste natus error sit voluptatem accusantium<br>Doloremque laudantium, totam rem aperiam eaque ipsa',
    track3: '[Verse 1]<br>Voluptatem quia voluptas sit aspernatur aut odit aut fugit<br>Sed quia consequuntur magni dolores eos qui ratione<br><br>[Chorus]<br>Voluptatem sequi nesciunt neque porro quisquam est<br>Qui dolorem ipsum quia dolor sit amet consectetur',
    track4: '[Verse 1]<br>Voluptatem ut enim ad minima veniam quis nostrum<br>Exercitationem ullam corporis suscipit laboriosam<br><br>[Chorus]<br>Nisi ut aliquid ex ea commodi consequatur quis autem<br>Vel eum iure reprehenderit qui in ea voluptate velit',
    track5: '[Verse 1]<br>At vero eos et accusamus et iusto odio dignissimos<br>Ducimus qui blanditiis praesentium voluptatum deleniti<br><br>[Chorus]<br>Atque corrupti quos dolores et quas molestias excepturi<br>Sint occaecati cupiditate non provident similique sunt'
  };

  return (
    <>
      <div className="app-container">
        <div className="content-wrapper">
        <h1 className="title-with-banner">
          <span className="title-word">AMERICAN</span>
          <div className="inline-banner">
            {[1,2,3,4,5,6,7].map(i => (
              <img key={i} src={`/spc${i}.png`} className="inline-spectrum-item" alt={`Spectrum ${i}`} />
            ))}
          </div>
          <span className="title-word">SPECTRUM</span>
        </h1>
        <h2>DEMO 25' - SEP 25, 2025</h2>
        
        <div className="card neo-brutalist">
          <div className="album-section">
            <div className="album-art-container">
              <img src="/spc.png" alt="American Spectrum Album Art" className="neo-brutalist album-art" />
            </div>
            <audio controls className="audio-player neo-brutalist">
              <source src="/demo.m4a" type="audio/mp4" />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
        
        <div className="card neo-brutalist">
          <div className="tracklist">
            {[
              { title: '1. Regulation Rules', track: 'track1' },
              { title: '2. Violent Reaction', track: 'track2' },
              { title: '3. Fire Make Fire Burn', track: 'track3' },
              { title: '4. Post Traumatic Mind', track: 'track4' },
              { title: '5. Brookings Cemetery', track: 'track5' }
            ].map((song, index) => (
              <div key={index} className="track-item">
                <span className="track-title">{song.title}</span>
                <Modal
                  title={song.title}
                  content={lyrics[song.track as keyof typeof lyrics]}
                  trigger={
                    <button className="neo-brutalist lyrics-btn">
                      Lyrics
                    </button>
                  }
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="card neo-brutalist">
          <div className="band-credits">
            <div className="band-section">
              <h3>Band Members</h3>
              <div className="band-grid">
                <div><strong>Tommy</strong> - Guitar</div>
                <div><strong>Jacob</strong> - Bass</div>
                <div><strong>Tony</strong> - Drums</div>
                <div><strong>Jonah</strong> - Vocals</div>
              </div>
            </div>
            <div className="credits-section">
              <h3>Production</h3>
              <div className="credits">
                <div><strong>Recorded by Aidan Stutzman</strong></div>
                <div><strong>@ Nam Studios</strong></div>
                <div>Sep 25, 2025</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card neo-brutalist">
          <div className="guestbook-form">
            <input
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="neo-brutalist form-input"
            />
            <textarea
              placeholder="Leave a message..."
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value)}
              className="neo-brutalist form-textarea"
              rows={3}
            />
            <button 
              onClick={addEntry}
              className="neo-brutalist submit-btn"
            >
              Sign Guestbook
            </button>
          </div>
          <div className="guestbook-entries">
            {entries.map((entry, index) => (
              <div key={index} className="neo-brutalist guestbook-entry">
                <div className="entry-name">{entry.name}</div>
                <div className="entry-message">{entry.message}</div>
                <div className="entry-date">{new Date(entry.timestamp).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
        

        </div>
      </div>
    </>
  );
}

export default App;
