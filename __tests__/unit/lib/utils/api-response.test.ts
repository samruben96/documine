import { describe, it, expect } from 'vitest';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

describe('successResponse', () => {
  it('should return Response with status 200', () => {
    const response = successResponse({ id: 1 });
    expect(response.status).toBe(200);
  });

  it('should return correct body structure with data', async () => {
    const data = { id: 1, name: 'Test Document' };
    const response = successResponse(data);
    const body = await response.json();

    expect(body).toEqual({
      data: { id: 1, name: 'Test Document' },
      error: null,
    });
  });

  it('should handle array data', async () => {
    const data = [{ id: 1 }, { id: 2 }];
    const response = successResponse(data);
    const body = await response.json();

    expect(body.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(body.error).toBeNull();
  });

  it('should handle null data', async () => {
    const response = successResponse(null);
    const body = await response.json();

    expect(body.data).toBeNull();
    expect(body.error).toBeNull();
  });

  it('should return Response instance', () => {
    const response = successResponse({});
    expect(response).toBeInstanceOf(Response);
  });
});

describe('errorResponse', () => {
  it('should return default 500 status when not specified', () => {
    const response = errorResponse('SERVER_ERROR', 'Internal error');
    expect(response.status).toBe(500);
  });

  it('should return custom status when provided', () => {
    const response = errorResponse('NOT_FOUND', 'Document not found', 404);
    expect(response.status).toBe(404);
  });

  it('should return correct error structure', async () => {
    const response = errorResponse('VALIDATION_ERROR', 'Invalid input');
    const body = await response.json();

    expect(body).toEqual({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
      },
    });
  });

  it('should include details when provided', async () => {
    const details = { field: 'email', reason: 'invalid format' };
    const response = errorResponse('VALIDATION_ERROR', 'Invalid input', 400, details);
    const body = await response.json();

    expect(body.error.details).toEqual(details);
  });

  it('should not include details key when not provided', async () => {
    const response = errorResponse('ERROR', 'Error occurred');
    const body = await response.json();

    expect(body.error).not.toHaveProperty('details');
  });

  it('should handle array details', async () => {
    const details = ['error1', 'error2'];
    const response = errorResponse('MULTIPLE_ERRORS', 'Multiple errors', 400, details);
    const body = await response.json();

    expect(body.error.details).toEqual(['error1', 'error2']);
  });

  it('should return Response instance', () => {
    const response = errorResponse('ERROR', 'Error');
    expect(response).toBeInstanceOf(Response);
  });
});
