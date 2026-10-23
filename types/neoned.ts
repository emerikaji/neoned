export interface Quay {
  id: string;
  name: string;
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  quays: Quay[];
  distance?: number;
}

export interface Arrival {
  line: string;
  direction: string;
  destination: string;
  expectedArrivalTime: string;
  arrivalStatus: string;
  quayNumber: number;
}