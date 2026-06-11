import axios from 'axios';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params: { api_key: API_KEY },
});

export async function fetchPopularMovies(page = 1) {
  const res = await tmdb.get('/movie/popular', { params: { page } });
  return res.data.results;
}

export async function fetchPopularTV(page = 1) {
  const res = await tmdb.get('/tv/popular', { params: { page } });
  return res.data.results;
}

export async function fetchDetails(id: number, type: 'movie' | 'tv') {
  const res = await tmdb.get(`/${type}/${id}`);
  return res.data;
}
