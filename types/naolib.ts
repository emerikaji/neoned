export interface Naolib {
  Siri: {
    ServiceDelivery: {
      StopMonitoringDelivery: StopMonitoring[]
    }
  }
}

export interface StopMonitoring {
  MonitoredStopVisit: MonitoredStop[]
}

export interface MonitoredStop {
  MonitoringRef: Value
  MonitoredVehicleJourney: {
    LineRef: Value
    PublishedLineName: LangValue[]
    DestinationName: LangValue[]
    DirectionName: Value[]
    MonitoredCall: {
      DestinationDisplay: LangValue[]
      ExpectedArrivalTime: string
      ArrivalStatus: string
      StopPointRef: Value
      StopPointName: LangValue[]
    }
  }
}

export interface Value {
  value: string
}

export interface LangValue {
  value: string
  lang?: string
}

export interface GtfsAlertEntity {
  id: string;
  alert: {
    activePeriod?: { start: string; end: string }[];
    informedEntity?: { routeId?: string; stopId?: string }[];
    headerText?: { translation: { text: string }[] };
    descriptionText?: { translation: { text: string }[] };
    severityLevel?: 'INFO' | 'WARNING' | 'SEVERE';
  };
}

export interface GtfsFeedMessage {
  header?: {
    gtfsRealtimeVersion?: string;
    incrementality?: string;
    timestamp?: string;
  };
  entity?: GtfsAlertEntity[];
}