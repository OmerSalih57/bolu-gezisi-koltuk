export type SeatStatus = 'available' | 'occupied'

export type Seat = {
  number: number
  status: SeatStatus
}

export type BusCapacity = 46 | 55

export type BusNumber = 1 | 2 | 3

export type Bus = {
  id: string
  number: BusNumber
  name: string
  capacity: BusCapacity
  seats: Seat[]
}

export type Trip = {
  id: string
  title: string
  community: string
  origin: string
  destination: string
  departureAt: string
  buses: Bus[]
}

export type PublicSeat = {
  busNumber: BusNumber
  seatNumber: number
  isBooked: boolean
}

export type Booking = {
  busNumber: BusNumber
  seatNumber: number
  fullName: string
  nationalId: string
  phone: string
}

export type RosterEntry = {
  fullName: string
  nationalId: string
  phone: string
}

export type RosterPerson = RosterEntry & {
  isRegistered: boolean
}

export type PassengerInput = {
  fullName: string
  nationalId: string
  phone: string
}
