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
  const [showReplyForm, setShowReplyForm] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    fetch("/api/discussion")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEntries(data.map(entry => ({
            ...entry,
            replies: entry.replies || []
          })));
        } else {
          setEntries([]);
        }
      })
      .catch(() => setEntries([]));
  }, []);

  const addEntry = async () => {
    if (!guestName.trim() || !guestMessage.trim()) {
      setError('Please fill in both name and message');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guestName.trim(), message: guestMessage.trim() })
      });
      
      if (!response.ok) throw new Error('Failed to post message');
      
      const newEntry = await response.json();
      setEntries([newEntry, ...entries]);
      setGuestName("");
      setGuestMessage("");
    } catch (error) {
      setError('Failed to post message. Please try again.');
      console.error('Failed to add entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReply = async (entryId: string) => {
    const replyData = replyInputs[entryId];
    if (!replyData?.name.trim() || !replyData?.message.trim()) {
      setError('Please fill in both name and message for reply');
      return;
    }
    
    setReplyLoading(prev => ({ ...prev, [entryId]: true }));
    setError(null);
    
    try {
      const response = await fetch(`/api/discussion/${entryId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: replyData.name.trim(), message: replyData.message.trim() })
      });
      
      if (!response.ok) throw new Error('Failed to post reply');
      
      const newReply = await response.json();
      setEntries(entries.map(entry => 
        entry.id === entryId 
          ? { ...entry, replies: [...entry.replies, newReply] }
          : entry
      ));
      setReplyInputs(prev => ({ ...prev, [entryId]: { name: "", message: "" } }));
      setShowReplies(prev => ({ ...prev, [entryId]: true }));
    } catch (error) {
      setError('Failed to post reply. Please try again.');
      console.error('Failed to add reply:', error);
    } finally {
      setReplyLoading(prev => ({ ...prev, [entryId]: false }));
    }
  };

  const updateReplyInput = (entryId: string, field: 'name' | 'message', value: string) => {
    setReplyInputs(prev => ({
      ...prev,
      [entryId]: {
        name: prev[entryId]?.name || '',
        message: prev[entryId]?.message || '',
        [field]: value
      }
    }));
  };

  const toggleReplies = (entryId: string) => {
    setShowReplies(prev => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  const toggleReplyForm = (entryId: string) => {
    setShowReplyForm(prev => {
      const newState = { ...prev };
      // Close all other reply forms
      Object.keys(newState).forEach(key => {
        if (key !== entryId) {
          newState[key] = false;
        }
      });
      // Toggle the clicked one
      newState[entryId] = !prev[entryId];
      return newState;
    });
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const clearError = () => setError(null);

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const response = await fetch(`/api/discussion/${entryId}`, {
        method: "DELETE",
        headers: { "X-Admin-Password": adminPassword }
      });
      
      if (!response.ok) {
        setError('Failed to delete. Check admin password.');
        return;
      }
      
      setEntries(entries.filter(e => e.id !== entryId));
    } catch (error) {
      setError('Failed to delete comment.');
      console.error('Failed to delete entry:', error);
    }
  };

  const toggleAdminMode = () => {
    if (!adminMode) {
      const pass = prompt('Enter admin password:');
      if (pass) {
        setAdminPassword(pass);
        setAdminMode(true);
      }
    } else {
      setAdminMode(false);
      setAdminPassword("");
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
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3 style={{margin: 0}}>Discussion</h3>
            <button 
              onClick={toggleAdminMode}
              style={{
                padding: '0.5rem 1rem',
                background: adminMode ? '#dc2626' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {adminMode ? '🔓 Admin Mode' : '🔒 Admin'}
            </button>
          </div>
          <div className="guestbook-form">
            {error && (
              <div className="error-message" role="alert">
                {error}
                <button onClick={clearError} className="error-close" aria-label="Close error">
                  ×
                </button>
              </div>
            )}
            <input
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="neo-brutalist form-input"
              maxLength={50}
              aria-label="Your name"
              disabled={loading}
            />
            <div className="textarea-container">
              <textarea
                placeholder="Start a discussion..."
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                className="neo-brutalist form-textarea"
                rows={3}
                maxLength={500}
                aria-label="Your message"
                disabled={loading}
              />
              <div className="char-count">
                {guestMessage.length}/500
              </div>
            </div>
            <button 
              onClick={addEntry}
              className="neo-brutalist submit-btn"
              disabled={loading || !guestName.trim() || !guestMessage.trim()}
              aria-label="Post your message"
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  Posting...
                </>
              ) : (
                'Post Message'
              )}
            </button>
          </div>
          <div className="guestbook-entries">
            {entries && entries.length > 0 ? entries.map((entry) => (
              <article key={entry.id} className="neo-brutalist discussion-entry" data-entry-id={entry.id}>
                <div className="entry-header">
                  <span className="entry-author">{entry.name}</span>
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    <span className="entry-datetime">{formatDateTime(entry.timestamp)}</span>
                    {adminMode && (
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                        aria-label="Delete comment"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <div className="entry-message">{entry.message}</div>
                
                <div className="entry-actions">
                  {entry.replies && entry.replies.length > 0 && (
                    <button 
                      onClick={() => toggleReplies(entry.id)}
                      className="show-replies-btn"
                    >
                      {showReplies[entry.id] ? 'Hide' : 'Show'} {entry.replies.length} {entry.replies.length === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                  <button 
                    onClick={() => toggleReplyForm(entry.id)}
                    className="reply-toggle"
                  >
                    {showReplyForm[entry.id] ? 'Cancel' : 'Reply'}
                  </button>
                </div>
                
                <div className="reply-section">
                  {showReplyForm[entry.id] && (
                    <div className="reply-form">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={replyInputs[entry.id]?.name || ''}
                        onChange={(e) => updateReplyInput(entry.id, 'name', e.target.value)}
                        className="reply-input"
                        maxLength={50}
                        aria-label={`Reply name for ${entry.name}'s message`}
                        disabled={replyLoading[entry.id]}
                      />
                      <div className="reply-message-container">
                        <input
                          type="text"
                          placeholder="Your message"
                          value={replyInputs[entry.id]?.message || ''}
                          onChange={(e) => updateReplyInput(entry.id, 'message', e.target.value)}
                          className="reply-input reply-message"
                          maxLength={300}
                          aria-label={`Reply message for ${entry.name}'s message`}
                          disabled={replyLoading[entry.id]}
                        />
                        <div className="reply-char-count">
                          {(replyInputs[entry.id]?.message || '').length}/300
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          addReply(entry.id);
                          setShowReplyForm(prev => ({ ...prev, [entry.id]: false }));
                        }}
                        className="reply-btn"
                        disabled={replyLoading[entry.id] || !replyInputs[entry.id]?.name?.trim() || !replyInputs[entry.id]?.message?.trim()}
                        aria-label="Post your reply"
                      >
                        {replyLoading[entry.id] ? (
                          <>
                            <span className="spinner" aria-hidden="true"></span>
                            Posting...
                          </>
                        ) : (
                          'Post Reply'
                        )}
                      </button>
                    </div>
                  )}
                  
                  {showReplies[entry.id] && entry.replies && entry.replies.length > 0 && (
                    <div className="replies">
                      {entry.replies.map((reply) => (
                        <div key={reply.id} className="reply">
                          <div className="reply-header">
                            <span className="reply-author">{reply.name}</span>
                            <span className="reply-datetime">{formatDateTime(reply.timestamp)}</span>
                          </div>
                          <div className="reply-message">{reply.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )) : (
              <div className="empty-state">
                <p>No discussions yet. Be the first to start a conversation!</p>
              </div>
            )}
          </div>
        </div>
        

        </div>
      </div>
    </>
  );
}

export default App;
