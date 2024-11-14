import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface RouteData {
  title: string;
  href: string;
  icon?: string;
  children?: RouteData[];
}

interface RoutesState {
  availableRoutes: string[];
  routeData: { [key: string]: RouteData };
  isLoading: boolean;
  error: string | null;
}

interface RouteItem {
  path: string;
  title: string;
}

const initialState: RoutesState = {
  availableRoutes: [],
  routeData: {},
  isLoading: true,
  error: null
};

export const fetchRoutes = createAsyncThunk(
  'routes/fetchRoutes',
  async (data: RouteItem[], { rejectWithValue }) => {
    try {
      return {
        availableRoutes: data.map((route) => String(route.path)),
        routeData: Object.fromEntries(
          data.map((route) => [
            String(route.path),
            {
              title: String(route.title),
              href: String(route.path)
            }
          ])
        )
      };
    } catch (error) {
      return rejectWithValue(String(error));
    }
  }
);

export const isValidRoute = (state: { routes: RoutesState }, path: string) => {
  return state.routes.availableRoutes.includes(path);
};

const RouteSlice = createSlice({
  name: 'routes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.availableRoutes = action.payload.availableRoutes;
        state.routeData = action.payload.routeData;
        state.isLoading = false;
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch routes';
      });
  }
});

export default RouteSlice.reducer; 