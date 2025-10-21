// interfaces/user.interface.ts

export interface IUser {
  id?: number;
  username: string;
  password?: string;
  email: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  cp: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserResponse {
  id: number;
  username: string;
  email: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  cp: string;
  role: string;
  token?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IRegisterRequest {
  username: string;
  password: string;
  email: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  cp: string;
}