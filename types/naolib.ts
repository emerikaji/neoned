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
    MonitoredCall: {
      DestinationDisplay: LangValue[]
      ExpectedArrivalTime: string
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