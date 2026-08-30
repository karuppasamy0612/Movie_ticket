import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Film,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Play,
  Search,
  ShieldCheck,
  Star,
  Ticket,
  UserRound,
  X,
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';

type Movie = {
  id: string;
  title: string;
  genre: string;
  rating: string;
  duration: string;
  release: string;
  description: string;
  image: string;
  backdrop: string;
  accent: string;
};

type Booking = {
  reference: string;
  movie: Movie;
  date: string;
  time: string;
  cinema: string;
  seats: string[];
  total: number;
};

const movies: Movie[] = [
  {
    id: 'the-last-signal',
    title: 'The Last Signal',
    genre: 'Sci-Fi · Thriller',
    rating: 'PG-13',
    duration: '2h 08m',
    release: 'Now showing',
    description: 'In a city that forgot how to sleep, one final broadcast could change the future.',
    image: 'https://images.pexels.com/photos/14440801/pexels-photo-14440801.jpeg?auto=compress&cs=tinysrgb&h=900&w=600',
    backdrop: 'https://images.pexels.com/photos/14440801/pexels-photo-14440801.jpeg?auto=compress&cs=tinysrgb&h=1200&w=2000',
    accent: '#dcb06a',
  },
  {
    id: 'after-the-rain',
    title: 'After the Rain',
    genre: 'Drama · Romance',
    rating: 'PG',
    duration: '1h 54m',
    release: 'Now showing',
    description: 'Two familiar strangers find a new beginning on the quietest street in London.',
    image: 'https://images.pexels.com/photos/11592363/pexels-photo-11592363.jpeg?auto=compress&cs=tinysrgb&h=900&w=600',
    backdrop: 'https://images.pexels.com/photos/11592363/pexels-photo-11592363.jpeg?auto=compress&cs=tinysrgb&h=1200&w=2000',
    accent: '#b9cdbd',
  },
  {
    id: 'the-odyssey',
    title: 'The Odyssey',
    genre: 'Adventure · Fantasy',
    rating: '12A',
    duration: '2h 21m',
    release: 'Now showing',
    description: 'A mythic journey across impossible seas, from the award-winning director of North.',
    image: 'https://images.pexels.com/photos/39089463/pexels-photo-39089463.jpeg?auto=compress&cs=tinysrgb&h=900&w=600',
    backdrop: 'https://images.pexels.com/photos/39089463/pexels-photo-39089463.jpeg?auto=compress&cs=tinysrgb&h=1200&w=2000',
    accent: '#cf9a63',
  },
  {
    id: 'midnight-arcade',
    title: 'Midnight Arcade',
    genre: 'Comedy · Coming of age',
    rating: '15',
    duration: '1h 46m',
    release: 'Coming Friday',
    description: 'One last night, four best friends, and an arcade that refuses to close.',
    image: 'https://images.pexels.com/photos/37472964/pexels-photo-37472964.jpeg?auto=compress&cs=tinysrgb&h=900&w=600',
    backdrop: 'https://images.pexels.com/photos/37472964/pexels-photo-37472964.jpeg?auto=compress&cs=tinysrgb&h=1200&w=2000',
    accent: '#dfb2a4',
  },
];

const dates = [
  { day: 'Today', date: '28', month: 'Aug' },
  { day: 'Tomorrow', date: '29', month: 'Aug' },
  { day: 'Saturday', date: '30', month: 'Aug' },
  { day: 'Sunday', date: '31', month: 'Aug' },
];
const times = ['10:20 AM', '1:15 PM', '3:45 PM', '6:30 PM', '9:10 PM'];
const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
const seats = Array.from({ length: 72 }, (_, index) => `${rows[Math.floor(index / 12)]}${(index % 12) + 1}`);
const unavailableSeats = new Set(['A4', 'A5', 'B8', 'B9', 'C2', 'C3', 'D7', 'E10', 'F1', 'F2', 'F3']);

function App() {
  const [activeMovie, setActiveMovie] = useState<Movie>(movies[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState(times[2]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isBookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setAccountOpen(false);
    await supabase.auth.signOut();
  };

  const filteredMovies = useMemo(
    () => movies.filter((movie) => movie.title.toLowerCase().includes(searchQuery.toLowerCase()) || movie.genre.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery],
  );
  const ticketTotal = selectedSeats.length * 14.5;

  const chooseMovie = (movie: Movie) => {
    setActiveMovie(movie);
    setSelectedSeats([]);
    document.getElementById('showtimes')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleSeat = (seat: string) => {
    if (unavailableSeats.has(seat)) return;
    setSelectedSeats((current) => current.includes(seat) ? current.filter((item) => item !== seat) : [...current, seat]);
  };

  const confirmBooking = async () => {
    if (selectedSeats.length === 0) return;
    if (!session) {
      setBookingOpen(false);
      setAuthOpen(true);
      return;
    }
    setSaving(true);
    const reference = `LUM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const nextBooking: Booking = {
      reference,
      movie: activeMovie,
      date: `${dates[selectedDate].day}, ${dates[selectedDate].date} ${dates[selectedDate].month}`,
      time: selectedTime,
      cinema: 'Lumen House · Screen 04',
      seats: selectedSeats,
      total: ticketTotal,
    };

    const { error } = await supabase.from('bookings').insert({
      booking_reference: reference,
      movie_title: activeMovie.title,
      show_date: nextBooking.date,
      show_time: selectedTime,
      cinema_name: nextBooking.cinema,
      seats: selectedSeats,
      total_amount: ticketTotal,
    });

    if (!error) {
      setBooking(nextBooking);
      setBookingOpen(false);
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#f6f4f0] text-[#151515]">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Lumen home"><span className="brand-mark"><Film size={17} strokeWidth={2.5} /></span><span>LUMEN</span></a>
        <nav className={`main-nav ${menuOpen ? 'main-nav-open' : ''}`}>
          <a className="active" href="#movies" onClick={() => setMenuOpen(false)}>Movies</a>
          <a href="#showtimes" onClick={() => setMenuOpen(false)}>Cinemas</a>
          <a href="#experience" onClick={() => setMenuOpen(false)}>The Lumen experience</a>
        </nav>
        <div className="header-actions"><button className="location-button"><MapPin size={15} /> London <ChevronDown size={14} /></button>{session ? (<div style={{ position: 'relative' }}><button className={`icon-button ${session ? 'account-signed-in' : ''}`} aria-label="Account" onClick={() => setAccountOpen(!accountOpen)}><UserRound size={19} /></button>{accountOpen && (<div className="account-menu"><div className="account-email">{session.user.email}</div><button onClick={signOut}><LogOut size={15} /> Sign out</button></div>)}</div>) : (<button className="icon-button" aria-label="Sign in" onClick={() => setAuthOpen(true)}><UserRound size={19} /></button>)}<button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></div>
      </header>

      <section id="top" className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(8, 10, 10, .92) 0%, rgba(8, 10, 10, .66) 43%, rgba(8, 10, 10, .12) 100%), url(${activeMovie.backdrop})` }}>
        <div className="hero-inner">
          <div className="eyebrow"><span className="eyebrow-line" /> Featured this week</div>
          <h1>{activeMovie.title}</h1>
          <p className="hero-description">{activeMovie.description}</p>
          <div className="hero-meta"><span className="rating-tag">{activeMovie.rating}</span><span>{activeMovie.genre}</span><span>{activeMovie.duration}</span></div>
          <div className="hero-actions"><button className="button button-light" onClick={() => document.getElementById('showtimes')?.scrollIntoView({ behavior: 'smooth' })}>Book tickets <ArrowRight size={16} /></button><button className="watch-button"><span className="play-icon"><Play size={13} fill="currentColor" /></span> Watch trailer</button></div>
        </div>
        <div className="hero-pagination"><span className="pagination-current">01</span><span className="pagination-line" /><span>04</span></div>
      </section>

      <section id="movies" className="section-shell discover-section">
        <div className="section-heading"><div><p className="section-kicker">Curated for you</p><h2>Find your next story</h2></div><div className="search-wrap"><Search size={17} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search movies" /></div></div>
        <div className="movie-grid">{filteredMovies.map((movie) => <button className={`movie-card ${movie.id === activeMovie.id ? 'selected' : ''}`} key={movie.id} onClick={() => chooseMovie(movie)}><div className="poster-wrap"><img src={movie.image} alt={`${movie.title} poster`} /><span className="poster-status">{movie.release}</span><span className="poster-heart"><Heart size={16} /></span></div><div className="movie-card-info"><h3>{movie.title}</h3><p>{movie.genre} <span>·</span> {movie.duration}</p></div></button>)}</div>
      </section>

      <section id="showtimes" className="booking-section">
        <div className="section-shell booking-layout">
          <div className="booking-main"><p className="section-kicker">Make it a night out</p><h2>Choose a showtime</h2><p className="booking-intro">Select a date and time for <strong>{activeMovie.title}</strong> at Lumen House.</p><div className="date-list">{dates.map((date, index) => <button key={date.date} className={`date-option ${index === selectedDate ? 'date-selected' : ''}`} onClick={() => setSelectedDate(index)}><span>{date.day}</span><strong>{date.date}</strong><small>{date.month}</small></button>)}</div><div className="time-list">{times.map((time) => <button key={time} className={`time-option ${selectedTime === time ? 'time-selected' : ''}`} onClick={() => setSelectedTime(time)}><Clock3 size={15} /> {time}</button>)}</div><button className="button button-dark booking-cta" onClick={() => setBookingOpen(true)}>Select seats <ArrowRight size={16} /></button></div>
          <aside className="venue-card"><div className="venue-image" style={{ backgroundImage: 'url(https://images.pexels.com/photos/14120221/pexels-photo-14120221.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200)' }} /><div className="venue-copy"><div><p className="section-kicker">Your local cinema</p><h3>Lumen House</h3></div><span className="venue-rating"><Star size={14} fill="currentColor" /> 4.9</span><p className="venue-address"><MapPin size={14} /> 14 Mercer Street, London</p><button className="text-button">Explore cinema <ArrowRight size={15} /></button></div></aside>
        </div>
      </section>

      <section id="experience" className="experience-section"><div className="section-shell experience-grid"><div><p className="section-kicker">More than a movie</p><h2>Come for the story.<br /><em>Stay for the feeling.</em></h2></div><div className="experience-copy"><p>Independent cinema, considered comfort, and a little more magic in every frame. Lumen brings the ritual of movie night back to life.</p><div className="feature-row"><span><ShieldCheck size={18} /> Big sound, small rooms</span><span><Ticket size={18} /> Book in a few taps</span></div></div></div></section>

      <footer className="site-footer"><div className="footer-brand"><a className="brand" href="#top"><span className="brand-mark"><Film size={17} strokeWidth={2.5} /></span><span>LUMEN</span></a><p>Stories worth leaving home for.</p></div><div className="footer-links"><a href="#movies">Movies</a><a href="#showtimes">Cinemas</a><a href="#experience">About Lumen</a><a href="#top">Help & contact</a></div><span className="copyright">© 2026 Lumen Cinemas</span></footer>

      {isBookingOpen && <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="booking-modal"><button className="modal-close" onClick={() => setBookingOpen(false)} aria-label="Close"><X size={20} /></button><div className="modal-heading"><p className="section-kicker">{activeMovie.title}</p><h2>Pick your seats</h2><p>{dates[selectedDate].day}, {dates[selectedDate].date} {dates[selectedDate].month} · {selectedTime}</p></div><div className="screen-label"><span /> Screen <span /></div><div className="seat-map">{rows.map((row) => <div className="seat-row" key={row}><span className="row-label">{row}</span>{seats.filter((seat) => seat.startsWith(row)).map((seat) => <button aria-label={`Seat ${seat}`} key={seat} disabled={unavailableSeats.has(seat)} className={`seat ${unavailableSeats.has(seat) ? 'seat-unavailable' : ''} ${selectedSeats.includes(seat) ? 'seat-selected' : ''}`} onClick={() => toggleSeat(seat)}>{seat.slice(1)}</button>)}</div>)}</div><div className="seat-legend"><span><i className="legend-swatch" /> Available</span><span><i className="legend-swatch legend-selected" /> Selected</span><span><i className="legend-swatch legend-unavailable" /> Taken</span></div><div className="modal-summary"><div><span>{selectedSeats.length} {selectedSeats.length === 1 ? 'ticket' : 'tickets'}</span><strong>£{ticketTotal.toFixed(2)}</strong></div><button className="button button-dark" disabled={!selectedSeats.length || isSaving} onClick={confirmBooking}>{isSaving ? 'Confirming…' : 'Confirm seats'} <ArrowRight size={16} /></button></div></div></div>}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthed={() => setAuthOpen(false)} />

      {booking && <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="confirmation-modal"><div className="success-icon"><Check size={26} /></div><p className="section-kicker">You’re all set</p><h2>Your night starts here.</h2><p className="confirmation-copy">Your tickets for <strong>{booking.movie.title}</strong> are confirmed. We’ve saved everything you need for the door.</p><div className="ticket-card"><div className="ticket-card-top"><div><span>Booking reference</span><strong>{booking.reference}</strong></div><Ticket size={23} /></div><div className="ticket-details"><span><CalendarDays size={15} /> {booking.date}</span><span><Clock3 size={15} /> {booking.time}</span><span><MapPin size={15} /> {booking.cinema}</span><span><CreditCard size={15} /> Seats {booking.seats.join(', ')}</span></div><div className="ticket-total"><span>Total paid</span><strong>£{booking.total.toFixed(2)}</strong></div></div><button className="button button-dark full-button" onClick={() => setBooking(null)}>Back to movies <ArrowRight size={16} /></button></div></div>}
    </main>
  );
}

export default App;
