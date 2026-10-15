

import { useState } from 'react';

import './App.css';



const API_URL = 'http://localhost:5000/api/auth';

const CANDIDATES_API_URL = 'http://localhost:5000/api/candidates';
const VOTES_API_URL = 'http://localhost:5000/api/votes';



function App() {

  const [showAuth, setShowAuth] = useState(false);

  const [mode, setMode] = useState('login');



  const [form, setForm] = useState({

    name: '',

    email: '',

    password: '',

  });



  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');

  const [messageType, setMessageType] = useState('');

  const [user, setUser] = useState(null);



  // Added: JWT token and candidate states

  const [token, setToken] = useState('');

  const [candidates, setCandidates] = useState([]);

  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const [candidatesError, setCandidatesError] = useState('');
  
const [candidateForm, setCandidateForm] = useState({
  name: '',
  party: '',
  description: '',
});

const [addingCandidate, setAddingCandidate] = useState(false);
const [candidateFormMessage, setCandidateFormMessage] = useState('');
const [candidateFormMessageType, setCandidateFormMessageType] = useState('');

  const [hasVoted, setHasVoted] = useState(false);
  const [voteStatusLoading, setVoteStatusLoading] = useState(false);
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteMessage, setVoteMessage] = useState('');
  const [voteMessageType, setVoteMessageType] = useState('');
  
const [electionResults, setElectionResults] = useState(null);
const [resultsLoading, setResultsLoading] = useState(false);
const [resultsError, setResultsError] = useState('');




  function openAuth(selectedMode = 'login') {

    setMode(selectedMode);

    setForm({ name: '', email: '', password: '' });

    setMessage('');

    setMessageType('');

    setShowAuth(true);



    document.getElementById('auth')?.scrollIntoView({

      behavior: 'smooth',

    });

  }



  function handleChange(event) {

    setForm({

      ...form,

      [event.target.name]: event.target.value,

    });

  }



  // Added: Fetch candidates using the JWT token

  async function fetchCandidates(authToken) {

    setCandidatesLoading(true);

    setCandidatesError('');



    try {

      const response = await fetch(CANDIDATES_API_URL, {

        method: 'GET',

        headers: {

          Authorization: `Bearer ${authToken}`,

        },

      });



      const data = await response.json();



      if (!response.ok) {

        throw new Error(data.message || 'Unable to load candidates.');

      }



      setCandidates(data.candidates || []);

    } catch (error) {

      setCandidatesError(

        error.message === 'Failed to fetch'

          ? 'Cannot connect to the backend. Please make sure the server is running.'

          : error.message

      );

    } finally {

      setCandidatesLoading(false);

    }

  }
  
async function fetchElectionResults(authToken) {
  if (!authToken || user?.role !== 'admin') {
    return;
  }

  setResultsLoading(true);
  setResultsError('');

  try {
    const response = await fetch(`${VOTES_API_URL}/results`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || 'Unable to load election results.'
      );
    }

    setElectionResults(data);
  } catch (error) {
    setResultsError(
      error.message === 'Failed to fetch'
        ? 'Backend se connection nahi ho pa raha.'
        : error.message
    );
  } finally {
    setResultsLoading(false);
  }
}

  
async function handleAddCandidate(event) {
  event.preventDefault();

  if (!token || user?.role !== 'admin' || addingCandidate) {
    return;
  }

  setAddingCandidate(true);
  setCandidateFormMessage('');
  setCandidateFormMessageType('');

  try {
    const response = await fetch(CANDIDATES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: candidateForm.name.trim(),
        party: candidateForm.party.trim(),
        description: candidateForm.description.trim(),
        electionId: 'college-election-2026',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to add candidate.');
    }

    setCandidateForm({
      name: '',
      party: '',
      description: '',
    });

    setCandidateFormMessage(
      data.message || 'Candidate added successfully.'
    );
    setCandidateFormMessageType('success');

    await fetchCandidates(token);
  } catch (error) {
    setCandidateFormMessage(
      error.message === 'Failed to fetch'
        ? 'Backend se connection nahi ho pa raha. Server check karo.'
        : error.message
    );
    setCandidateFormMessageType('error');
  } finally {
    setAddingCandidate(false);
  }
}




  async function fetchVoteStatus(authToken) {
    setVoteStatusLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/votes/status', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to check voting status.');
      setHasVoted(Boolean(data.hasVoted));
    } catch (error) {
      setVoteMessage(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the voting service. Check that the backend is running and /api/votes is registered.'
          : error.message
      );
      setVoteMessageType('error');
    } finally {
      setVoteStatusLoading(false);
    }
  }

  async function handleVote(candidate) {
    if (!token || hasVoted || voteSubmitting) return;
    const confirmed = window.confirm(
      `Confirm your vote for ${candidate.name}? You can vote only once in this election.`
    );
    if (!confirmed) return;

    setVoteSubmitting(true);
    setVoteMessage('');
    setVoteMessageType('');
    try {
      const response = await fetch('http://localhost:5000/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ candidateId: candidate._id }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) setHasVoted(true);
        throw new Error(data.message || 'Unable to submit your vote.');
      }
      setHasVoted(true);
      setVoteMessage(data.message || 'Your vote has been submitted successfully.');
      setVoteMessageType('success');
    } catch (error) {
      setVoteMessage(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the voting service. Check that the backend is running and /api/votes is registered.'
          : error.message
      );
      setVoteMessageType('error');
    } finally {
      setVoteSubmitting(false);
    }
  }

  async function handleSubmit(event) {

    event.preventDefault();

    setMessage('');

    setMessageType('');



    if (mode === 'register' && form.name.trim().length < 2) {

      setMessage('Name must contain at least 2 characters.');

      setMessageType('error');

      return;

    }



    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {

      setMessage('Please enter a valid email address.');

      setMessageType('error');

      return;

    }



    if (form.password.length < 12 || form.password.length > 72) {

      setMessage('Password must contain 12 to 72 characters.');

      setMessageType('error');

      return;

    }



    setLoading(true);



    try {

      const endpoint =

        mode === 'register' ? '/register' : '/login';



      const payload =

        mode === 'register'

          ? {

              name: form.name.trim(),

              email: form.email.trim().toLowerCase(),

              password: form.password,

            }

          : {

              email: form.email.trim().toLowerCase(),

              password: form.password,

            };



      const response = await fetch(`${API_URL}${endpoint}`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify(payload),

      });



      const data = await response.json();



      if (!response.ok) {

        throw new Error(data.message || 'Request failed.');

      }



      if (mode === 'register') {

        setMessage('Registration successful! You can now log in.');

        setMessageType('success');

        setMode('login');



        setForm({

          name: '',

          email: payload.email,

          password: '',

        });

      } else {

        // Added: Keep the short-lived token in React memory

        setUser(data.user);

        setToken(data.token);



        setMessage('Login successful! Welcome to SecureVote.');

        setMessageType('success');

        setForm({ name: '', email: '', password: '' });



        // Added: Load candidates after successful login

        if (data.token) {

          await fetchCandidates(data.token);
          await fetchVoteStatus(data.token);

        } else {

          setCandidatesError(

            'Login succeeded, but the server did not return an authentication token. Please log in again.'

          );

        }

      }

    } catch (error) {

      setMessage(

        error.message === 'Failed to fetch'

          ? 'Cannot connect to the backend. Make sure the server is running.'

          : error.message

      );

      setMessageType('error');

    } finally {

      setLoading(false);

    }

  }



  function handleLogout() {

    setUser(null);



    // Added: Clear authentication and candidate data

    setToken('');

    setCandidates([]);

    setCandidatesError('');

    setCandidatesLoading(false);



    setMessage('You have been logged out.');

    setMessageType('success');

    setShowAuth(true);

    setMode('login');



    setForm({

      name: '',

      email: '',

      password: '',

    });

  }
  
async function testVoterResultsAccess() {
  try {
    const response = await fetch('http://localhost:5000/api/votes/results', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    alert(`HTTP Status: ${response.status}\n${data.message || 'Request completed'}`);
  } catch (error) {
    alert('API test failed: ' + error.message);
  }
}




  return (

    <div className="app">
      <button
      type="button"
      onClick={testVoterResultsAccess}
      style={{ padding: '10px', margin: '10px' }}
    >
      Test Voter Results Security
    </button>

      <nav className="navbar">

        <a href="#home" className="brand">

          <span className="brand-icon">✓</span>

          <span>SecureVote</span>

        </a>



        <span className="nav-label">

          Electronic Voting Platform

        </span>



        <a href="#about" className="nav-link">

          About

        </a>

      </nav>



      <main id="home">

        <section className="hero">

          <div className="status">

            <span className="status-dot"></span>

            SECURITY-FOCUSED PROTOTYPE

          </div>



          <h1>

            Your Vote.

            <br />

            <span>Your Voice.</span>

          </h1>



          <p className="hero-description">

            A secure electronic voting platform prototype

            designed to demonstrate authentication,

            access control, data protection and secure voting.

          </p>



          <div className="hero-actions">

            {user ? (

              <button

                className="primary-button"

                onClick={() =>

                  document.getElementById('account')?.scrollIntoView({

                    behavior: 'smooth',

                  })

                }

              >

                View Account →

              </button>

            ) : (

              <>

                <button

                  className="primary-button"

                  onClick={() => openAuth('login')}

                >

                  Login →

                </button>



                <button

                  className="secondary-button"

                  onClick={() => openAuth('register')}

                >

                  Create Account

                </button>

              </>

            )}



            <a href="#security" className="secondary-button">

              Explore Security

            </a>

          </div>



          <p className="notice">

            Academic demonstration only. Not for real elections.

          </p>

        </section>



        {user && (

          <section className="account-section" id="account">

            <div className="account-card">

              <div className="account-avatar">

                {user.name?.charAt(0)?.toUpperCase() || 'V'}

              </div>



              <h2>Welcome, {user.name}!</h2>

              <p>You are logged in to SecureVote.</p>



              <div className="account-details">

                <p>

                  <strong>Email:</strong> {user.email}

                </p>



                <p>

                  <strong>Role:</strong> {user.role}

                </p>

              </div>



              {/* Added: Candidate list */}

              <div

                className="candidates-section"

                style={{

                  marginTop: '32px',

                  textAlign: 'left',

                  width: '100%',

                }}

              >

{user?.role === 'admin' && (
  <div
    className="feature-card"
    style={{
      padding: '24px',
      marginBottom: '28px',
      borderRadius: '16px',
    }}
  >
    <h2>Admin Dashboard</h2>
    <p>Add a new candidate to the current election.</p>

    <form onSubmit={handleAddCandidate}>
      <div className="form-group">
        <label htmlFor="candidateName">Candidate Name</label>
        <input
          id="candidateName"
          type="text"
          value={candidateForm.name}
          onChange={(event) =>
            setCandidateForm({
              ...candidateForm,
              name: event.target.value,
            })
          }
          minLength={2}
          maxLength={80}
          required
          placeholder="Enter candidate name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="candidateParty">Party Name</label>
        <input
          id="candidateParty"
          type="text"
          value={candidateForm.party}
          onChange={(event) =>
            setCandidateForm({
              ...candidateForm,
              party: event.target.value,
            })
          }
          maxLength={100}
          required
          placeholder="Enter party name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="candidateDescription">Description</label>
        <textarea
          id="candidateDescription"
          value={candidateForm.description}
          onChange={(event) =>
            setCandidateForm({
              ...candidateForm,
              description: event.target.value,
            })
          }
          maxLength={500}
          placeholder="Enter candidate description"
          rows={3}
        />
      </div>

      {candidateFormMessage && (
        <div
          className={`form-message ${candidateFormMessageType}`}
          role="status"
          aria-live="polite"
        >
          {candidateFormMessage}
        </div>
      )}

      <button
        type="submit"
        className="primary-button"
        disabled={addingCandidate}
      >
        {addingCandidate ? 'Adding Candidate...' : 'Add Candidate'}
      </button>
    </form>
  </div>
)}

{user?.role === 'admin' && (
  <div
    className="feature-card"
    style={{
      padding: '24px',
      marginBottom: '28px',
      borderRadius: '16px',
    }}
  >
    <h2>Election Results</h2>
    <p>
      Election: college-election-2026
    </p>

    <button
      type="button"
      className="primary-button"
      onClick={() => fetchElectionResults(token)}
      disabled={resultsLoading}
    >
      {resultsLoading ? 'Loading Results...' : 'Refresh Results'}
    </button>

    {resultsError && (
      <p role="alert" style={{ color: '#c62828' }}>
        {resultsError}
      </p>
    )}

    {electionResults && (
      <>
        <h3>
          Total Votes Cast: {electionResults.totalVotes}
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '16px',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr>
                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  Candidate
                </th>
                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  Party
                </th>
                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  Votes
                </th>
              </tr>
            </thead>

            <tbody>
              {electionResults.results.map((candidate) => (
                <tr key={candidate.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                    {candidate.name}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                    {candidate.party}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                    {candidate.totalVotes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
  </div>
)}

                <h2 style={{ textAlign: 'center' }}>

                  Election Candidates

                </h2>



                <p style={{ textAlign: 'center' }}>

                  Review the candidates participating in the election.

                </p>



                {candidatesLoading && (

                  <p role="status" style={{ textAlign: 'center' }}>

                    Loading candidates...

                  </p>

                )}



                {candidatesError && (

                  <div

                    className="form-message error"

                    role="alert"

                    style={{ margin: '16px 0' }}

                  >

                    {candidatesError}



                    <button

                      type="button"

                      className="secondary-button"

                      style={{ marginLeft: '12px' }}

                      disabled={candidatesLoading || !token}

                      onClick={() => fetchCandidates(token)}

                    >

                      Retry

                    </button>

                  </div>

                )}



                {!candidatesLoading &&

                  !candidatesError &&

                  candidates.length === 0 && (

                    <p style={{ textAlign: 'center' }}>

                      No candidates are available for display yet.

                    </p>

                  )}



                {candidates.length > 0 && (

                  <div

                    className="candidate-list"

                    style={{

                      display: 'grid',

                      gridTemplateColumns:

                        'repeat(auto-fit, minmax(220px, 1fr))',

                      gap: '18px',

                      marginTop: '24px',

                    }}

                  >

                    {candidates.map((candidate) => (

                      <article

                        key={candidate._id}

                        className="feature-card candidate-card"

                        style={{

                          padding: '22px',

                          height: '100%',

                          boxSizing: 'border-box',

                        }}

                      >

                        <div

                          className="feature-icon"

                          aria-hidden="true"

                        >

                          👤

                        </div>



                        <h3>{candidate.name}</h3>



                        <p>

                          <strong>Party:</strong> {candidate.party}

                        </p>



                        {candidate.description && (

                          <p>{candidate.description}</p>

                        )}



                        <p style={{ fontSize: '13px', opacity: 0.8 }}>

                          Election: {candidate.electionId}

                        </p>

                        <button
                          type="button"
                          className="primary-button"
                          style={{ width: '100%', marginTop: '12px' }}
                          disabled={hasVoted || voteStatusLoading || voteSubmitting || user.role !== 'voter'}
                          onClick={() => handleVote(candidate)}
                        >
                          {voteSubmitting
                            ? 'Submitting vote...'
                            : hasVoted
                              ? 'Vote Already Submitted'
                              : user.role !== 'voter'
                                ? 'Voter Access Required'
                                : 'Vote Now'}
                        </button>

                      </article>

                    ))}

                  </div>

                )}

              </div>



              {voteStatusLoading && (
                <p role="status" style={{ marginTop: '20px', textAlign: 'center' }}>
                  Checking your voting status...
                </p>
              )}

              {voteMessage && (
                <div
                  className={`form-message ${voteMessageType}`}
                  role={voteMessageType === 'error' ? 'alert' : 'status'}
                  aria-live="polite"
                  style={{ marginTop: '20px' }}
                >
                  {voteMessage}
                </div>
              )}

              <p className="notice" style={{ marginTop: '24px' }}>
                {hasVoted
                  ? 'Your vote has been recorded. You cannot vote again in this election.'
                  : 'Review the candidates carefully. Once submitted, your vote cannot be changed.'}
              </p>



              <button

                className="primary-button"

                onClick={handleLogout}

              >

                Logout

              </button>

            </div>

          </section>

        )}



        {showAuth && !user && (

          <section className="auth-section" id="auth">

            <div className="auth-card">

              <div className="auth-heading">

                <span className="auth-icon">🔐</span>

                <p className="eyebrow">SECUREVOTE ACCOUNT</p>



                <h2>

                  {mode === 'login'

                    ? 'Welcome Back'

                    : 'Create Your Account'}

                </h2>



                <p>

                  {mode === 'login'

                    ? 'Enter your details to log in.'

                    : 'Register as a voter to get started.'}

                </p>

              </div>



              <div className="auth-tabs">

                <button

                  type="button"

                  className={mode === 'login' ? 'active' : ''}

                  onClick={() => {

                    setMode('login');

                    setMessage('');

                    setMessageType('');

                  }}

                >

                  Login

                </button>



                <button

                  type="button"

                  className={mode === 'register' ? 'active' : ''}

                  onClick={() => {

                    setMode('register');

                    setMessage('');

                    setMessageType('');

                  }}

                >

                  Register

                </button>

              </div>



              <form onSubmit={handleSubmit}>

                {mode === 'register' && (

                  <div className="form-group">

                    <label htmlFor="name">Full Name</label>



                    <input

                      id="name"

                      name="name"

                      type="text"

                      placeholder="Enter your full name"

                      value={form.name}

                      onChange={handleChange}

                      minLength={2}

                      maxLength={80}

                      autoComplete="name"

                      required

                    />

                  </div>

                )}



                <div className="form-group">

                  <label htmlFor="email">Email Address</label>



                  <input

                    id="email"

                    name="email"

                    type="email"

                    placeholder="you@example.com"

                    value={form.email}

                    onChange={handleChange}

                    autoComplete="email"

                    maxLength={254}

                    required

                  />

                </div>



                <div className="form-group">

                  <label htmlFor="password">Password</label>



                  <input

                    id="password"

                    name="password"

                    type="password"

                    placeholder="Enter your password"

                    value={form.password}

                    onChange={handleChange}

                    minLength={12}

                    maxLength={72}

                    autoComplete={

                      mode === 'login'

                        ? 'current-password'

                        : 'new-password'

                    }

                    required

                  />



                  <small>

                    Use 12–72 characters for this prototype.

                  </small>

                </div>



                {message && (

                  <div

                    className={`form-message ${messageType}`}

                    role="status"

                    aria-live="polite"

                  >

                    {message}

                  </div>

                )}



                <button

                  type="submit"

                  className="primary-button submit-button"

                  disabled={loading}

                >

                  {loading

                    ? 'Please wait...'

                    : mode === 'login'

                      ? 'Login Securely'

                      : 'Create Account'}

                </button>

              </form>



              {!message && (

                <p className="form-footnote">

                  Your password is sent to the backend over the

                  local development connection and is hashed

                  before being stored in the database.

                </p>

              )}



              <p className="switch-mode">

                {mode === 'login'

                  ? "Don't have an account?"

                  : 'Already have an account?'}{' '}



                <button

                  type="button"

                  onClick={() => {

                    setMode(mode === 'login' ? 'register' : 'login');

                    setMessage('');

                    setMessageType('');

                  }}

                >

                  {mode === 'login' ? 'Register' : 'Login'}

                </button>

              </p>

            </div>

          </section>

        )}



        <section className="features" id="security">

          <article className="feature-card">

            <div className="feature-icon">🔐</div>

            <h2>Authentication</h2>

            <p>

              Verify user identity before allowing protected actions.

            </p>

          </article>



          <article className="feature-card">

            <div className="feature-icon">🛡️</div>

            <h2>Access Control</h2>

            <p>

              Restrict voting and administrative actions by user role.

            </p>

          </article>



          <article className="feature-card">

            <div className="feature-icon">✓</div>

            <h2>Secure Voting</h2>

            <p>

              Design controls to protect vote submission and prevent

              duplicate voting.

            </p>

          </article>

        </section>



        <section className="about" id="about">

          <h2>Built with security in mind</h2>

          <p>

            This project demonstrates selected cybersecurity

            requirements through a functional web application,

            security testing and documented implementation.

          </p>

        </section>

      </main>



      <footer>

        SecureVote · Electronic Voting Platform Prototype

      </footer>

    </div>

  );

}



export default App;
