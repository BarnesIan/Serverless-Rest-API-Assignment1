
export type Movie = {
    movieId: number;
    genre_ids: number[];
    original_language : string;
    overview: string;
    popularity: number;
    release_date: string;
    title: string
    video: boolean;
    vote_average: number;
    vote_count: number
  }
export type MovieReview = {
    movieId: number;
    reviewerName: string,
    reviewDate: string;
    rating: number;
    content: string;
  }
   // Used to validate the query string og HTTP Get requests
export type MovieReviewsQueryParams = {
    minRating: number;
};