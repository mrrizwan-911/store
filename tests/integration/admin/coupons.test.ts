import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/client';
import { signAccessToken } from '@/lib/auth/jwt';
import { GET, POST } from '@/app/api/admin/coupons/route';
import { PATCH, DELETE } from '@/app/api/admin/coupons/[id]/route';

let testToken: string;

describe('Admin Coupons API', () => {
  beforeAll(async () => {
    // Ensure clean state before running tests
    await db.coupon.deleteMany();
    await db.user.deleteMany({ where: { email: 'admin-coupons@test.com' } });

    // Create an admin user token once for all tests in this block
    const user = await db.user.create({
      data: { name: 'Admin User', email: 'admin-coupons@test.com', passwordHash: 'hash', role: 'ADMIN' }
    });
    testToken = signAccessToken({ userId: user.id, email: user.email, role: 'ADMIN' });
  });

  afterAll(async () => {
    // Clean up after all tests
    await db.coupon.deleteMany();
    await db.user.deleteMany({ where: { email: 'admin-coupons@test.com' } });
  });

  beforeEach(async () => {
    // Clean up coupons before each test
    await db.coupon.deleteMany();
  });

  function createReq(url: string, method: string, body?: any, token?: string) {
    const headers = new Headers();
    if (token) headers.set('authorization', `Bearer ${token}`);

    return new NextRequest(`http://localhost${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  }

  it('should create a new percentage coupon', async () => {
    const req = createReq('/api/admin/coupons', 'POST', {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      discountValue: 10,
      isActive: true
    }, testToken);
    
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.code).toBe('WELCOME10');
    expect(json.data.discountPct).toBe(10);
    expect(json.data.discountFlat).toBeNull();
  });

  it('should create a new flat coupon', async () => {
    const req = createReq('/api/admin/coupons', 'POST', {
      code: 'FLAT500',
      type: 'FLAT',
      discountValue: 500,
      isActive: true
    }, testToken);
    
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.code).toBe('FLAT500');
    // Decimal from Prisma gets serialized as string in JSON
    expect(json.data.discountFlat).toBe('500');
    expect(json.data.discountPct).toBeNull();
  });

  it('should prevent creating a coupon with existing code', async () => {
    // First create one manually
    await db.coupon.create({
      data: {
        code: 'WELCOME10',
        discountPct: 10,
        isActive: true
      }
    });

    const req = createReq('/api/admin/coupons', 'POST', {
      code: 'WELCOME10', // Already created
      type: 'PERCENTAGE',
      discountValue: 20,
      isActive: true
    }, testToken);
    
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Coupon code already exists');
  });

  it('should list all coupons', async () => {
    // Create coupons before checking
    await db.coupon.create({
      data: {
        code: 'WELCOME10',
        discountPct: 10,
        isActive: true
      }
    });
    await db.coupon.create({
      data: {
        code: 'FLAT500',
        discountFlat: 500,
        isActive: true
      }
    });

    const req = createReq('/api/admin/coupons', 'GET', undefined, testToken);
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.length).toBe(2);
    expect(json.data.some((c: any) => c.code === 'WELCOME10')).toBe(true);
    expect(json.data.some((c: any) => c.code === 'FLAT500')).toBe(true);
  });

  it('should partially update a coupon (toggle isActive)', async () => {
    const coupon = await db.coupon.create({
      data: {
        code: 'TOGGLE_ME',
        discountPct: 15,
        isActive: true
      }
    });

    const req = createReq(`/api/admin/coupons/${coupon.id}`, 'PATCH', {
      isActive: false
    }, testToken);

    const res = await PATCH(req, { params: { id: coupon.id } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.isActive).toBe(false);

    // Verify in db
    const updated = await db.coupon.findUnique({ where: { id: coupon.id } });
    expect(updated?.isActive).toBe(false);
  });

  it('should fully update a coupon', async () => {
    const coupon = await db.coupon.create({
      data: {
        code: 'UPDATE_ME',
        discountPct: 15,
        isActive: true
      }
    });

    const req = createReq(`/api/admin/coupons/${coupon.id}`, 'PATCH', {
      code: 'UPDATED_CODE',
      type: 'FLAT',
      discountValue: 100,
      isActive: true
    }, testToken);

    const res = await PATCH(req, { params: { id: coupon.id } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.code).toBe('UPDATED_CODE');
    expect(json.data.discountFlat).toBe('100');
    expect(json.data.discountPct).toBeNull();
  });

  it('should prevent updating a coupon to an existing code', async () => {
    await db.coupon.create({
      data: {
        code: 'EXISTING_CODE',
        discountPct: 10,
        isActive: true
      }
    });

    const couponToUpdate = await db.coupon.create({
      data: {
        code: 'UPDATING_CODE',
        discountPct: 20,
        isActive: true
      }
    });

    const req = createReq(`/api/admin/coupons/${couponToUpdate.id}`, 'PATCH', {
      code: 'EXISTING_CODE', // Already exists
      type: 'PERCENTAGE',
      discountValue: 20,
      isActive: true
    }, testToken);

    const res = await PATCH(req, { params: { id: couponToUpdate.id } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Coupon code already exists');
  });

  it('should delete a coupon', async () => {
    const coupon = await db.coupon.create({
      data: {
        code: 'DELETE_ME',
        discountPct: 5,
        isActive: true
      }
    });

    const req = createReq(`/api/admin/coupons/${coupon.id}`, 'DELETE', undefined, testToken);
    const res = await DELETE(req, { params: { id: coupon.id } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    // Verify in db
    const deleted = await db.coupon.findUnique({ where: { id: coupon.id } });
    expect(deleted).toBeNull();
  });
});
