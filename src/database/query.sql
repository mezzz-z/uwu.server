CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(255),
    friends UUID[],
    status VARCHAR(50) NOT NULL DEFAULT 'offline',
    friend_requests UUID[]
);
CREATE TABLE rooms (
    room_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name VARCHAR(55) NOT NULL,
    users_ids UUID[] NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_text VARCHAR(555) NOT NULL,
    sender_id UUID REFERENCES users(user_id) NOT NULL,
    room_id UUID REFERENCES rooms(room_id) NOT NULL,
    created_at TIMESTAMP NOT NULL
);
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(message_id),
    message_sender_id UUID REFERENCES users(user_id),
    room_id UUID REFERENCES rooms(room_id),
    owner_id UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW()
);