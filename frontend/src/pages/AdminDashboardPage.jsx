import React, { useState, useEffect } from 'react';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import { Shield, Film, Building2, Calendar, Users, DollarSign, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isAdmin, isTheatreAdmin, openAuthModal } = useAuth();

  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'movie' | 'theatre' | 'show'
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Dropdown lists
  const [moviesList, setMoviesList] = useState([]);
  const [theatresList, setTheatresList] = useState([]);

  // Create Movie Form
  const [movieForm, setMovieForm] = useState({
    title: '',
    language: 'English',
    durationMinutes: 150,
    releaseDate: '2026-11-01',
    description: '',
    certification: 'UA',
    posterUrl: '',
    bannerUrl: '',
    genreNames: 'Action, Sci-Fi'
  });

  // Create Theatre Form
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    city: 'Ahmedabad',
    address: ''
  });

  // Create Screen Form
  const [screenForm, setScreenForm] = useState({
    theatreId: '',
    name: 'Screen 1 - Atmos',
    screenType: 'Dolby Atmos 2D'
  });

  // Schedule Show Form
  const [showForm, setShowForm] = useState({
    movieId: '',
    screenId: '',
    startTime: '',
    classicPrice: 250,
    primePrice: 380,
    reclinerPrice: 550
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsQuery = `
        query {
          adminStats {
            totalUsers
            totalMovies
            totalTheatres
            totalShows
            totalBookings
            totalRevenue
          }
          movies {
            id
            title
            slug
          }
          theatres {
            id
            name
            city
            screens {
              id
              name
              screenType
              totalSeats
            }
          }
        }
      `;
      const data = await graphqlRequest(statsQuery);
      setStats(data.adminStats);
      setMoviesList(data.movies || []);
      setTheatresList(data.theatres || []);

      if (data.movies?.length > 0) {
        setShowForm((prev) => ({ ...prev, movieId: data.movies[0].id }));
      }
      if (data.theatres?.length > 0) {
        setScreenForm((prev) => ({ ...prev, theatreId: data.theatres[0].id }));
        if (data.theatres[0].screens?.length > 0) {
          setShowForm((prev) => ({ ...prev, screenId: data.theatres[0].screens[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading admin stats:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || isTheatreAdmin) {
      loadDashboardData();
    }
  }, [isAdmin, isTheatreAdmin]);

  if (!isAdmin && !isTheatreAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F8F9FA]">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-10 text-center max-w-md w-full shadow-card">
          <div className="w-16 h-16 rounded-full bg-[#FEF9EE] text-[#E5B642] mx-auto flex items-center justify-center mb-4 border border-[#F2D38A]">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1E232A]">Administrative Access Restricted</h2>
          <p className="text-sm text-[#64748B] mt-2 mb-6">
            You must be signed in with an Administrator or Theatre Manager account to view this management console.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-2.5 bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] font-bold rounded-full text-sm transition shadow-xs"
          >
            Sign In with Admin Account
          </button>
        </div>
      </div>
    );
  }

  const handleCreateMovie = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');
    try {
      const mutation = `
        mutation CreateMovie($input: CreateMovieInput!) {
          createMovie(input: $input) {
            id
            title
          }
        }
      `;
      const genresArray = movieForm.genreNames.split(',').map((g) => g.trim()).filter(Boolean);
      await graphqlRequest(mutation, {
        input: {
          title: movieForm.title,
          language: movieForm.language,
          durationMinutes: parseInt(movieForm.durationMinutes, 10),
          releaseDate: movieForm.releaseDate,
          description: movieForm.description,
          certification: movieForm.certification,
          posterUrl: movieForm.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600',
          bannerUrl: movieForm.bannerUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600',
          genreNames: genresArray
        }
      });
      setStatusMsg(`Movie '${movieForm.title}' created successfully!`);
      setMovieForm({ title: '', language: 'English', durationMinutes: 150, releaseDate: '2026-11-01', description: '', certification: 'UA', posterUrl: '', bannerUrl: '', genreNames: 'Action, Sci-Fi' });
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateTheatre = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');
    try {
      const mutation = `
        mutation CreateTheatre($input: CreateTheatreInput!) {
          createTheatre(input: $input) {
            id
            name
          }
        }
      `;
      await graphqlRequest(mutation, {
        input: {
          name: theatreForm.name,
          city: theatreForm.city,
          address: theatreForm.address
        }
      });
      setStatusMsg(`Theatre '${theatreForm.name}' created successfully!`);
      setTheatreForm({ name: '', city: 'Ahmedabad', address: '' });
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateScreen = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');
    try {
      const mutation = `
        mutation CreateScreen($input: CreateScreenInput!) {
          createScreen(input: $input) {
            id
            name
            totalSeats
          }
        }
      `;
      const res = await graphqlRequest(mutation, {
        input: {
          theatreId: screenForm.theatreId,
          name: screenForm.name,
          screenType: screenForm.screenType
        }
      });
      setStatusMsg(`Screen '${screenForm.name}' created with ${res.createScreen.totalSeats} seats configured!`);
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleScheduleShow = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');

    if (!showForm.startTime) {
      setErrorMsg('Please select a valid show start date and time.');
      return;
    }

    try {
      const mutation = `
        mutation ScheduleShow($input: ScheduleShowInput!) {
          scheduleShow(input: $input) {
            id
            startTime
          }
        }
      `;
      await graphqlRequest(mutation, {
        input: {
          movieId: showForm.movieId,
          screenId: showForm.screenId,
          startTime: new Date(showForm.startTime).toISOString(),
          classicPrice: parseFloat(showForm.classicPrice),
          primePrice: parseFloat(showForm.primePrice),
          reclinerPrice: parseFloat(showForm.reclinerPrice)
        }
      });
      setStatusMsg('Show scheduled successfully! Inventory seats generated.');
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Control Bar */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 mb-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FEF9EE] text-[#E5B642] border border-[#F2D38A] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1E232A]">BookIN Partner & Admin Hub</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Logged in as <span className="font-semibold text-[#1E232A]">{user?.fullName}</span> ({user?.roles?.join(', ')})
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-[#F8F9FA] border border-[#E2E8F0] p-1 rounded-full text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'movie', label: 'Add Movie' },
              { id: 'theatre', label: 'Theatres & Screens' },
              { id: 'show', label: 'Schedule Show' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setStatusMsg(''); setErrorMsg(''); }}
                className={`px-4 py-1.5 rounded-full transition ${
                  activeTab === tab.id
                    ? 'bg-white text-[#E5B642] shadow-sm font-bold border border-[#E2E8F0]'
                    : 'text-[#64748B] hover:text-[#1E232A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-medium">{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Overview Analytics */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-subtle">
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Registered Users</span>
                <p className="text-2xl font-bold text-[#1E232A] mt-1">{stats.totalUsers}</p>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-subtle">
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Active Movies</span>
                <p className="text-2xl font-bold text-[#E5B642] mt-1">{stats.totalMovies}</p>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-subtle">
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Theatres</span>
                <p className="text-2xl font-bold text-[#1E232A] mt-1">{stats.totalTheatres}</p>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-subtle">
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Total Shows</span>
                <p className="text-2xl font-bold text-[#1E232A] mt-1">{stats.totalShows}</p>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-subtle">
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Bookings Made</span>
                <p className="text-2xl font-bold text-[#E5B642] mt-1">{stats.totalBookings}</p>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-subtle">
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Gross Revenue</span>
                <p className="text-2xl font-bold text-[#1E232A] mt-1">₹{stats.totalRevenue?.toFixed(0)}</p>
              </div>
            </div>

            {/* Theatre & Screen Status Overview */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-subtle">
              <h2 className="text-base font-bold text-[#1E232A] mb-4">Configured Theatres & Screens</h2>
              <div className="space-y-3">
                {theatresList.length === 0 ? (
                  <p className="text-sm text-[#64748B]">No theatres registered yet.</p>
                ) : (
                  theatresList.map((t) => (
                    <div key={t.id} className="p-4 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#1E232A] text-sm">{t.name} <span className="text-xs font-normal text-[#64748B]">({t.city})</span></h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {t.screens?.map((sc) => (
                            <span key={sc.id} className="px-2.5 py-1 rounded bg-white border border-[#E2E8F0] text-xs text-[#475569] font-medium">
                              {sc.name} • {sc.totalSeats} seats ({sc.screenType})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Create Movie */}
        {activeTab === 'movie' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 max-w-2xl shadow-subtle">
            <h2 className="text-base font-bold text-[#1E232A] mb-5 flex items-center space-x-2">
              <Film className="w-5 h-5 text-[#E5B642]" />
              <span>Add New Movie Release</span>
            </h2>

            <form onSubmit={handleCreateMovie} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#475569] mb-1 font-semibold">Movie Title</label>
                <input
                  type="text"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  placeholder="e.g. Gladiator II"
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Language</label>
                  <input
                    type="text"
                    required
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={movieForm.durationMinutes}
                    onChange={(e) => setMovieForm({ ...movieForm, durationMinutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Release Date</label>
                  <input
                    type="date"
                    required
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Certification</label>
                  <select
                    value={movieForm.certification}
                    onChange={(e) => setMovieForm({ ...movieForm, certification: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  >
                    <option value="U">U (Universal)</option>
                    <option value="UA">UA (Parental Guidance)</option>
                    <option value="A">A (Adults Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#475569] mb-1 font-semibold">Genres (comma separated)</label>
                <input
                  type="text"
                  value={movieForm.genreNames}
                  onChange={(e) => setMovieForm({ ...movieForm, genreNames: e.target.value })}
                  placeholder="Action, Sci-Fi, Drama"
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[#475569] mb-1 font-semibold">Description</label>
                <textarea
                  rows="3"
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  placeholder="Movie plot synopsis..."
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[#475569] mb-1 font-semibold">Poster Image URL (Optional)</label>
                <input
                  type="url"
                  value={movieForm.posterUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] font-bold rounded-full text-sm transition shadow-xs mt-2"
              >
                Create Movie
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Create Theatre & Screen */}
        {activeTab === 'theatre' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4 shadow-subtle">
              <h2 className="text-base font-bold text-[#1E232A] flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#E5B642]" />
                <span>Register New Theatre</span>
              </h2>

              <form onSubmit={handleCreateTheatre} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Theatre Name</label>
                  <input
                    type="text"
                    required
                    value={theatreForm.name}
                    onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                    placeholder="e.g. INOX: R-City Mall"
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">City</label>
                  <input
                    type="text"
                    required
                    value={theatreForm.city}
                    onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Address</label>
                  <textarea
                    rows="2"
                    required
                    value={theatreForm.address}
                    onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                    placeholder="Full street address..."
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#1E232A] hover:bg-[#2B323C] text-white font-semibold rounded-full text-sm transition shadow-xs"
                >
                  Create Theatre
                </button>
              </form>
            </div>

            {/* Add Screen to Theatre */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4 shadow-subtle">
              <h2 className="text-base font-bold text-[#1E232A] flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-[#E5B642]" />
                <span>Add Screen to Theatre</span>
              </h2>

              <form onSubmit={handleCreateScreen} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Select Theatre</label>
                  <select
                    value={screenForm.theatreId}
                    onChange={(e) => setScreenForm({ ...screenForm, theatreId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  >
                    {theatresList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Screen Name</label>
                  <input
                    type="text"
                    required
                    value={screenForm.name}
                    onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                    placeholder="e.g. Screen 1 - IMAX"
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Screen Type</label>
                  <select
                    value={screenForm.screenType}
                    onChange={(e) => setScreenForm({ ...screenForm, screenType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  >
                    <option value="Dolby Atmos 2D">Dolby Atmos 2D</option>
                    <option value="IMAX 3D">IMAX 3D</option>
                    <option value="4DX">4DX Motion</option>
                    <option value="Luxe Recliner">Luxe Recliner</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] font-bold rounded-full text-sm transition shadow-xs"
                >
                  Create Screen & Layout
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 4: Schedule Show */}
        {activeTab === 'show' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 max-w-2xl shadow-subtle">
            <h2 className="text-base font-bold text-[#1E232A] mb-5 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#E5B642]" />
              <span>Schedule New Movie Show</span>
            </h2>

            <form onSubmit={handleScheduleShow} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#475569] mb-1 font-semibold">Select Movie</label>
                <select
                  value={showForm.movieId}
                  onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                >
                  {moviesList.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#475569] mb-1 font-semibold">Select Screen</label>
                <select
                  value={showForm.screenId}
                  onChange={(e) => setShowForm({ ...showForm, screenId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                >
                  {theatresList.flatMap((t) =>
                    (t.screens || []).map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {t.name} — {sc.name} ({sc.screenType})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[#475569] mb-1 font-semibold">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={showForm.startTime}
                  onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Classic (₹)</label>
                  <input
                    type="number"
                    value={showForm.classicPrice}
                    onChange={(e) => setShowForm({ ...showForm, classicPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Prime (₹)</label>
                  <input
                    type="number"
                    value={showForm.primePrice}
                    onChange={(e) => setShowForm({ ...showForm, primePrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] mb-1 font-semibold">Recliner (₹)</label>
                  <input
                    type="number"
                    value={showForm.reclinerPrice}
                    onChange={(e) => setShowForm({ ...showForm, reclinerPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] font-bold rounded-full text-sm transition shadow-xs mt-2"
              >
                Schedule Show & Initialize Seats
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
