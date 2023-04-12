import { InMemoryCheckInsRepository } from '@/repositories/in-memory/in-memory-check-ins-repository'
import { expect, describe, it, beforeEach, vi, afterEach } from 'vitest'
import { Decimal } from '@prisma/client/runtime/library'

import { CheckInUseCase } from '@/use-cases/check-in'
import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository'
import { MaxNumberOfCheckInsError } from '../error/max-number-of-check-ins-error'
import { MaxDistanceError } from '../error/max-distance-error'

let checkInsRepository: InMemoryCheckInsRepository
let sut: CheckInUseCase
let gymsRepository: InMemoryGymsRepository

const gym1 = {
  id: 'gym-01',
  title: 'JavaScript Gym',
  description: '',
  phone: '',
  latitude: new Decimal(-23.5011322),
  longitude: new Decimal(-46.29736),
}

const validGym1CheckIn = {
  gymId: gym1.id,
  userId: 'user-01',
  userLatitude: Number(gym1.latitude),
  userLongitude: Number(Number),
}

const gym2 = {
  id: 'gym-02',
  title: 'JavaScript Gym',
  description: '',
  phone: '',
  latitude: new Decimal(-23.5481168),
  longitude: new Decimal(-46.3098606),
}

const invalidGym2CheckIn = {
  gymId: 'gym-02',
  userId: 'user-01',
  userLatitude: -23.5437176,
  userLongitude: -46.3184568,
}

describe('Check-in Use Case', () => {
  beforeEach(() => {
    checkInsRepository = new InMemoryCheckInsRepository()
    gymsRepository = new InMemoryGymsRepository()
    sut = new CheckInUseCase(checkInsRepository, gymsRepository)

    gymsRepository.create(gym1)

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be able to check in', async () => {
    const { checkIn } = await sut.execute(validGym1CheckIn)

    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('should not be able to check in twice in the same day', async () => {
    vi.setSystemTime(new Date(2022, 0, 20, 8, 0, 0))

    await sut.execute(validGym1CheckIn)

    await expect(() => sut.execute(validGym1CheckIn)).rejects.toBeInstanceOf(
      MaxNumberOfCheckInsError,
    )
  })

  it('should be able to check in twice but in different days', async () => {
    vi.setSystemTime(new Date(2022, 0, 20, 8, 0, 0))
    await sut.execute(validGym1CheckIn)

    vi.setSystemTime(new Date(2022, 0, 21, 8, 0, 0))
    const { checkIn } = await sut.execute(validGym1CheckIn)

    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('should not be able to check in on distant gym', async () => {
    gymsRepository.items.push(gym2)

    await expect(() => sut.execute(invalidGym2CheckIn)).rejects.toBeInstanceOf(
      MaxDistanceError,
    )
  })
})
