import { useState, useEffect } from "react";

import Modal from "./components/Modal";
import "./App.css";

interface Reply {
  id: string;
  name: string;
  message: string;
  timestamp: number;
}

interface DiscussionEntry {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  replies: Reply[];
}

function App() {
  const [entries, setEntries] = useState<DiscussionEntry[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [replyInputs, setReplyInputs] = useState<{[key: string]: {name: string, message: string}}>({});
  const [showReplies, setShowReplies] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetch("/api/discussion")
      .then(res => res.json())
      .then(data => setEntries(data))
      .catch(() => setEntries([]));
  }, []);

  const addEntry = async () => {
    if (!guestName.trim() || !guestMessage.trim()) return;
    
    try {
      const response = await fetch("/api/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guestName, message: guestMessage })
      });
      
      const newEntry = await response.json();
      setEntries([newEntry, ...entries]);
      setGuestName("");
      setGuestMessage("");
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
  };

  const addReply = async (entryId: string) => {
    const replyData = replyInputs[entryId];
    if (!replyData?.name.trim() || !replyData?.message.trim()) return;
    
    try {
      const response = await fetch(`/api/discussion/${entryId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: replyData.name, message: replyData.message })
      });
      
      const newReply = await response.json();
      setEntries(entries.map(entry => 
        entry.id === entryId 
          ? { ...entry, replies: [...entry.replies, newReply] }
          : entry
      ));
      setReplyInputs(prev => ({ ...prev, [entryId]: { name: "", message: "" } }));
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const updateReplyInput = (entryId: string, field: 'name' | 'message', value: string) => {
    setReplyInputs(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value
      }
    }));
  };

  const toggleReplies = (entryId: string) => {
    setShowReplies(prev => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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
          <h3>Discussion</h3>
          <div className="guestbook-form">
            <input
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="neo-brutalist form-input"
            />
            <textarea
              placeholder="Start a discussion..."
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value)}
              className="neo-brutalist form-textarea"
              rows={3}
            />
            <button 
              onClick={addEntry}
              className="neo-brutalist submit-btn"
            >
              Post Message
            </button>
          </div>
          <div className="guestbook-entries">
            {entries.map((entry) => (
              <div key={entry.id} className="neo-brutalist discussion-entry">
                <div className="entry-header">
                  <span className="entry-name">{entry.name}</span>
                  <span className="entry-datetime">{formatDateTime(entry.timestamp)}</span>
                </div>
                <div className="entry-message">{entry.message}</div>
                
                {entry.replies.length > 0 && (
                  <button 
                    onClick={() => toggleReplies(entry.id)}
                    className="show-replies-btn"
                  >
                    {showReplies[entry.id] ? 'Hide' : 'Show'} {entry.replies.length} replies
                  </button>
                )}
                
                <div className="reply-section">
                  <div className="reply-form">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={replyInputs[entry.id]?.name || ''}
                      onChange={(e) => updateReplyInput(entry.id, 'name', e.target.value)}
                      className="reply-input"
                    />
                    <input
                      type="text"
                      placeholder="Reply..."
                      value={replyInputs[entry.id]?.message || ''}
                      onChange={(e) => updateReplyInput(entry.id, 'message', e.target.value)}
                      className="reply-input"
                    />
                    <button 
                      onClick={() => addReply(entry.id)}
                      className="reply-btn"
                    >
                      Reply
                    </button>
                  </div>
                  
                  {showReplies[entry.id] && (
                    <div className="replies">
                      {entry.replies.map((reply) => (
                        <div key={reply.id} className="reply">
                          <div className="reply-header">
                            <span>{reply.name}</span>
                            <span className="entry-datetime">{formatDateTime(reply.timestamp)}</span>
                          </div>
                          <div>{reply.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
