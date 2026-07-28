import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfilesRepository } from './profilesRepo';
import { NotFoundError } from '../utils/errors';

// Mock the getDatabase function first
vi.mock('../db/sqlite', () => ({
    getDatabase: vi.fn()
}));

// Import the mocked module
import { getDatabase } from '../db/sqlite';

describe('ProfilesRepository', () => {
    let repository: ProfilesRepository;
    let mockDb: any;

    beforeEach(() => {
        // Create mock database connection
        mockDb = {
            db: {} as any,
            run: vi.fn(),
            get: vi.fn(),
            all: vi.fn(),
            close: vi.fn()
        };

        // Mock getDatabase to return our mock
        (getDatabase as any).mockResolvedValue(mockDb);

        repository = new ProfilesRepository(mockDb);
        vi.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all profiles mapped to camelCase', async () => {
            const mockRows = [
                { profile_id: 1, user_id: 'user1', first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com', phone: '555-0001', bio: 'Bio 1', avatar_url: 'https://example.com/1.png', created_at: '2024-01-15T10:00:00.000Z' },
                { profile_id: 2, user_id: 'user2', first_name: 'Bob', last_name: 'Jones', email: 'bob@example.com', phone: '555-0002', bio: 'Bio 2', avatar_url: null, created_at: '2024-01-16T11:00:00.000Z' }
            ];
            mockDb.all.mockResolvedValue(mockRows);

            const result = await repository.findAll();

            expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM profiles ORDER BY profile_id');
            expect(result).toHaveLength(2);
            expect(result[0].profileId).toBe(1);
            expect(result[0].firstName).toBe('Alice');
            expect(result[1].profileId).toBe(2);
        });

        it('should return empty array when no profiles exist', async () => {
            mockDb.all.mockResolvedValue([]);

            const result = await repository.findAll();

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            mockDb.all.mockRejectedValue(new Error('Database connection failed'));

            await expect(repository.findAll()).rejects.toThrow();
        });
    });

    describe('findById', () => {
        it('should return profile when found', async () => {
            const mockRow = {
                profile_id: 1,
                user_id: 'user1',
                first_name: 'Alice',
                last_name: 'Smith',
                email: 'alice@example.com',
                phone: '555-0001',
                bio: 'Bio text',
                avatar_url: 'https://example.com/1.png',
                created_at: '2024-01-15T10:00:00.000Z'
            };
            mockDb.get.mockResolvedValue(mockRow);

            const result = await repository.findById(1);

            expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM profiles WHERE profile_id = ?', [1]);
            expect(result?.profileId).toBe(1);
            expect(result?.firstName).toBe('Alice');
            expect(result?.email).toBe('alice@example.com');
        });

        it('should return null when profile not found', async () => {
            mockDb.get.mockResolvedValue(undefined);

            const result = await repository.findById(999);

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            mockDb.get.mockRejectedValue(new Error('Database error'));

            await expect(repository.findById(1)).rejects.toThrow();
        });
    });

    describe('create', () => {
        it('should create a new profile and return it', async () => {
            const newProfile = {
                userId: 'newuser',
                firstName: 'Charlie',
                lastName: 'Brown',
                email: 'charlie@example.com',
                phone: '555-9999',
                bio: 'New user bio',
                avatarUrl: 'https://example.com/charlie.png',
                createdAt: '2024-03-01T09:00:00.000Z'
            };

            mockDb.run.mockResolvedValue({ lastID: 5, changes: 1 });
            mockDb.get.mockResolvedValue({
                profile_id: 5,
                user_id: 'newuser',
                first_name: 'Charlie',
                last_name: 'Brown',
                email: 'charlie@example.com',
                phone: '555-9999',
                bio: 'New user bio',
                avatar_url: 'https://example.com/charlie.png',
                created_at: '2024-03-01T09:00:00.000Z'
            });

            const result = await repository.create(newProfile);

            expect(mockDb.run).toHaveBeenCalled();
            expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM profiles WHERE profile_id = ?', [5]);
            expect(result.profileId).toBe(5);
            expect(result.firstName).toBe('Charlie');
        });

        it('should throw error if created profile cannot be retrieved', async () => {
            mockDb.run.mockResolvedValue({ lastID: 5, changes: 1 });
            mockDb.get.mockResolvedValue(null);

            await expect(repository.create({
                userId: 'u',
                firstName: 'A',
                lastName: 'B',
                email: 'a@b.com',
                phone: '',
                bio: '',
                avatarUrl: '',
                createdAt: ''
            })).rejects.toThrow('Failed to retrieve created profile');
        });
    });

    describe('update', () => {
        it('should update existing profile and return updated data', async () => {
            const updateData = { firstName: 'Updated', bio: 'Updated bio' };

            mockDb.run.mockResolvedValue({ changes: 1 });
            mockDb.get.mockResolvedValue({
                profile_id: 1,
                user_id: 'user1',
                first_name: 'Updated',
                last_name: 'Smith',
                email: 'alice@example.com',
                phone: '555-0001',
                bio: 'Updated bio',
                avatar_url: null,
                created_at: '2024-01-15T10:00:00.000Z'
            });

            const result = await repository.update(1, updateData);

            expect(mockDb.run).toHaveBeenCalled();
            expect(result.firstName).toBe('Updated');
            expect(result.bio).toBe('Updated bio');
        });

        it('should throw NotFoundError when profile does not exist', async () => {
            mockDb.run.mockResolvedValue({ changes: 0 });

            await expect(repository.update(999, { firstName: 'Test' }))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('delete', () => {
        it('should delete existing profile', async () => {
            mockDb.run.mockResolvedValue({ changes: 1 });

            await repository.delete(1);

            expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM profiles WHERE profile_id = ?', [1]);
        });

        it('should throw NotFoundError when profile does not exist', async () => {
            mockDb.run.mockResolvedValue({ changes: 0 });

            await expect(repository.delete(999))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('exists', () => {
        it('should return true when profile exists', async () => {
            mockDb.get.mockResolvedValue({ count: 1 });

            const result = await repository.exists(1);

            expect(result).toBe(true);
            expect(mockDb.get).toHaveBeenCalledWith(
                'SELECT COUNT(*) as count FROM profiles WHERE profile_id = ?',
                [1]
            );
        });

        it('should return false when profile does not exist', async () => {
            mockDb.get.mockResolvedValue({ count: 0 });

            const result = await repository.exists(999);

            expect(result).toBe(false);
        });

        it('should return false when result is null', async () => {
            mockDb.get.mockResolvedValue(null);

            const result = await repository.exists(999);

            expect(result).toBe(false);
        });
    });
});
