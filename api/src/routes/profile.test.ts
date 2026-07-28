import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import profileRouter from './profile';
import { errorHandler, NotFoundError } from '../utils/errors';
import { getProfilesRepository } from '../repositories/profilesRepo';

vi.mock('../repositories/profilesRepo', () => ({
  getProfilesRepository: vi.fn(),
}));

let app: express.Express;
const mockRepo = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
const mockedGetProfilesRepository = getProfilesRepository as Mock;

describe('Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetProfilesRepository.mockResolvedValue(mockRepo);

    app = express();
    app.use(express.json());
    app.use('/profiles', profileRouter);
    app.use(errorHandler);
  });

  const newProfile = {
    userId: 'alice.smith',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    phone: '555-0001',
    bio: 'Supply chain specialist.',
    avatarUrl: 'https://example.com/alice.png',
    createdAt: '2024-01-15T10:00:00.000Z',
  };

  it('should create a new profile', async () => {
    mockRepo.create.mockResolvedValue({ profileId: 1, ...newProfile });

    const response = await request(app).post('/profiles').send(newProfile);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(newProfile);
    expect(response.body.profileId).toBe(1);
  });

  it('should get all profiles', async () => {
    mockRepo.findAll.mockResolvedValue([{ profileId: 1, ...newProfile }]);

    const response = await request(app).get('/profiles');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
  });

  it('should get a profile by ID', async () => {
    mockRepo.findById.mockResolvedValue({ profileId: 1, ...newProfile });

    const response = await request(app).get('/profiles/1');

    expect(response.status).toBe(200);
    expect(response.body.profileId).toBe(1);
    expect(response.body.firstName).toBe('Alice');
  });

  it('should update a profile by ID', async () => {
    const updatedProfile = { ...newProfile, bio: 'Updated bio.' };
    mockRepo.update.mockResolvedValue({ profileId: 1, ...updatedProfile });

    const response = await request(app).put('/profiles/1').send(updatedProfile);

    expect(response.status).toBe(200);
    expect(response.body.bio).toBe('Updated bio.');
  });

  it('should delete a profile by ID', async () => {
    mockRepo.delete.mockResolvedValue(undefined);

    const response = await request(app).delete('/profiles/1');

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existing profile on GET', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const response = await request(app).get('/profiles/99999');

    expect(response.status).toBe(404);
  });

  it('should return 404 when updating non-existing profile', async () => {
    mockRepo.update.mockRejectedValue(new NotFoundError('Profile', 99999));

    const response = await request(app).put('/profiles/99999').send(newProfile);

    expect(response.status).toBe(404);
  });

  it('should return 404 when deleting non-existing profile', async () => {
    mockRepo.delete.mockRejectedValue(new NotFoundError('Profile', 99999));

    const response = await request(app).delete('/profiles/99999');

    expect(response.status).toBe(404);
  });

  it('should return 404 for malformed profile ID', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const response = await request(app).get('/profiles/not-a-number');

    expect(response.status).toBe(404);
    expect(mockRepo.findById).toHaveBeenCalledWith(Number.NaN);
  });
});
