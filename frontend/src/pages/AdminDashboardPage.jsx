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
    city: 'Mumbai',
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
      <div className="min-h-screen py-32 text-center text-white">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Administrative Access Restricted</h2>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          You must be logged in as an Administrator or Theatre Manager to view this portal.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold rounded-xl text-xs"
        >
          Sign In with Admin Account
        </button>
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
      setTheatreForm({ name: '', city: 'Mumbai', address: '' });
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
    <div className="min-h-screen pb-24 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#242938] mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">BookIN Admin Control Hub</h1>
              <p className="text-xs text-slate-400">
                Operating as: <span className="text-amber-400 font-semibold">{user?.fullName}</span> ({user?.roles?.join(', ')})
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-[#161922] border border-[#242938] p-1 rounded-xl text-xs font-semibold">
            {['overview', 'movie', 'theatre', 'show'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setStatusMsg(''); setErrorMsg(''); }}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  activeTab === tab ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {statusMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Overview Analytics */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-[#161922] border border-[#242938] p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Users</span>
                <p className="text-2xl font-black text-white mt-1">{stats.totalUsers}</p>
              </div>

              <div className="bg-[#161922] border border-[#242938] p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Movies</span>
                <p className="text-2xl font-black text-rose-500 mt-1">{stats.totalMovies}</p>
              </div>

              <div className="bg-[#161922] border border-[#242938] p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Theatres</span>
                <p className="text-2xl font-black text-sky-400 mt-1">{stats.totalTheatres}</p>
              </div>

              <div className="bg-[#161922] border border-[#242938] p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Shows</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">{stats.totalShows}</p>
              </div>

              <div className="bg-[#161922] border border-[#242938] p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Bookings</span>
                <p className="text-2xl font-black text-amber-400 mt-1">{stats.totalBookings}</p>
              </div>

              <div className="bg-[#161922] border border-[#242938] p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Revenue</span>
                <p className="text-2xl font-black text-white mt-1">₹{stats.totalRevenue?.toFixed(0)}</p>
              </div>
            </div>

            {/* Theatre & Screen Status Overview */}
            <div className="bg-[#161922] border border-[#242938] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">Configured Theatres & Screens</h2>
              <div className="space-y-4">
                {theatresList.map((t) => (
                  <div key={t.id} className="p-4 bg-[#0c0e14] border border-[#242938] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{t.name} ({t.city})</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {t.screens?.map((sc) => (
                          <span key={sc.id} className="px-2 py-0.5 rounded bg-[#161922] border border-[#242938] text-[10px] text-slate-300">
                            {sc.name} • {sc.totalSeats} seats ({sc.screenType})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Create Movie */}
        {activeTab === 'movie' && (
          <div className="bg-[#161922] border border-[#242938] rounded-2xl p-6 sm:p-8 max-w-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Film className="w-5 h-5 text-rose-500" />
              <span>Add New Movie Release</span>
            </h2>

            <form onSubmit={handleCreateMovie} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Movie Title</label>
                <input
                  type="text"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  placeholder="e.g. Gladiator II"
                  className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Language</label>
                  <input
                    type="text"
                    required
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={movieForm.durationMinutes}
                    onChange={(e) => setMovieForm({ ...movieForm, durationMinutes: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Release Date</label>
                  <input
                    type="date"
                    required
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Certification</label>
                  <select
                    value={movieForm.certification}
                    onChange={(e) => setMovieForm({ ...movieForm, certification: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  >
                    <option value="U">U (Universal)</option>
                    <option value="UA">UA (Parental Guidance)</option>
                    <option value="A">A (Adults Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Genres (comma separated)</label>
                <input
                  type="text"
                  value={movieForm.genreNames}
                  onChange={(e) => setMovieForm({ ...movieForm, genreNames: e.target.value })}
                  placeholder="Action, Sci-Fi, Drama"
                  className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Description</label>
                <textarea
                  rows="3"
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  placeholder="Movie plot synopsis..."
                  className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold rounded-xl text-xs hover:from-rose-500 hover:to-rose-600 transition"
              >
                Create Movie
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Create Theatre & Screen */}
        {activeTab === 'theatre' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#161922] border border-[#242938] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                <span>Register New Theatre</span>
              </h2>

              <form onSubmit={handleCreateTheatre} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Theatre Name</label>
                  <input
                    type="text"
                    required
                    value={theatreForm.name}
                    onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                    placeholder="e.g. INOX: R-City Mall"
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">City</label>
                  <input
                    type="text"
                    required
                    value={theatreForm.city}
                    onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Address</label>
                  <textarea
                    rows="2"
                    required
                    value={theatreForm.address}
                    onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition"
                >
                  Create Theatre
                </button>
              </form>
            </div>

            {/* Add Screen to Theatre */}
            <div className="bg-[#161922] border border-[#242938] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Add Screen to Theatre</span>
              </h2>

              <form onSubmit={handleCreateScreen} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Select Theatre</label>
                  <select
                    value={screenForm.theatreId}
                    onChange={(e) => setScreenForm({ ...screenForm, theatreId: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  >
                    {theatresList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Screen Name</label>
                  <input
                    type="text"
                    required
                    value={screenForm.name}
                    onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                    placeholder="e.g. Screen 1 - IMAX"
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Screen Type</label>
                  <select
                    value={screenForm.screenType}
                    onChange={(e) => setScreenForm({ ...screenForm, screenType: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  >
                    <option value="Dolby Atmos 2D">Dolby Atmos 2D</option>
                    <option value="IMAX 3D">IMAX 3D</option>
                    <option value="4DX">4DX Motion</option>
                    <option value="Luxe Recliner">Luxe Recliner</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                >
                  Create Screen & Layout
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 4: Schedule Show */}
        {activeTab === 'show' && (
          <div className="bg-[#161922] border border-[#242938] rounded-2xl p-6 sm:p-8 max-w-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Schedule New Movie Show</span>
            </h2>

            <form onSubmit={handleScheduleShow} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Movie</label>
                <select
                  value={showForm.movieId}
                  onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                >
                  {moviesList.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Screen</label>
                <select
                  value={showForm.screenId}
                  onChange={(e) => setShowForm({ ...showForm, screenId: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
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
                <label className="block text-slate-300 mb-1 font-semibold">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={showForm.startTime}
                  onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                  className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Classic Price (₹)</label>
                  <input
                    type="number"
                    value={showForm.classicPrice}
                    onChange={(e) => setShowForm({ ...showForm, classicPrice: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Prime Price (₹)</label>
                  <input
                    type="number"
                    value={showForm.primePrice}
                    onChange={(e) => setShowForm({ ...showForm, primePrice: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Recliner Price (₹)</label>
                  <input
                    type="number"
                    value={showForm.reclinerPrice}
                    onChange={(e) => setShowForm({ ...showForm, reclinerPrice: e.target.value })}
                    className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black rounded-xl text-xs hover:from-amber-400 hover:to-amber-500 transition"
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
