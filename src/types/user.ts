export interface User {
  id?: string;
  userId: string;           // ID único del usuario
  name: string;             // Nombre completo
  email: string;            // Email para notificaciones
  phone?: string;           // Teléfono opcional
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserRequest {
  userId: string;
  name: string;
  email: string;
  phone?: string;
}
