package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"sync"
	"time"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
)

type User struct {
	ID          string `json:"id"`
	Identifier  string `json:"identifier"`
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
	Role        string `json:"role"`
	RoleLabel   string `json:"roleLabel"`
}

type Session struct {
	Token     string
	User      User
	CreatedAt time.Time
}

type Service struct {
	mu       sync.RWMutex
	users    []seedUser
	sessions map[string]Session
}

type seedUser struct {
	User
	Password string
}

func NewService() *Service {
	return &Service{
		users: []seedUser{
			{User: User{ID: "usr-student", Identifier: "FUT/2022/CSC/10428", DisplayName: "Adaeze N. Okeke", Email: "student@futech.edu.ng", Role: "student", RoleLabel: "Student"}, Password: "demo1234"},
			{User: User{ID: "usr-lecturer", Identifier: "FUT/STF/CSC/0391", DisplayName: "Dr. F. Okonkwo", Email: "lecturer@futech.edu.ng", Role: "lecturer", RoleLabel: "Lecturer"}, Password: "demo1234"},
			{User: User{ID: "usr-adviser", Identifier: "FUT/STF/CSC/0288", DisplayName: "Dr. Chioma Madu", Email: "adviser@futech.edu.ng", Role: "adviser", RoleLabel: "Level Adviser"}, Password: "demo1234"},
			{User: User{ID: "usr-hod", Identifier: "FUT/STF/CSC/0102", DisplayName: "Prof. Kunle Adewale", Email: "hod@futech.edu.ng", Role: "hod", RoleLabel: "Head of Department"}, Password: "demo1234"},
			{User: User{ID: "usr-dean", Identifier: "FUT/STF/COM/0007", DisplayName: "Prof. Adaeze Nwachukwu", Email: "dean@futech.edu.ng", Role: "dean", RoleLabel: "Dean of Faculty"}, Password: "demo1234"},
			{User: User{ID: "usr-exams", Identifier: "FUT/STF/EXM/0451", DisplayName: "Mr. Sunday Eke", Email: "exams@futech.edu.ng", Role: "exams", RoleLabel: "Exams & Records"}, Password: "demo1234"},
			{User: User{ID: "usr-bursary", Identifier: "FUT/STF/BUR/0319", DisplayName: "Mrs. Halima Bello", Email: "bursary@futech.edu.ng", Role: "bursary", RoleLabel: "Bursary Officer"}, Password: "demo1234"},
			{User: User{ID: "usr-librarian", Identifier: "FUT/STF/LIB/0044", DisplayName: "Mrs. Grace Eze", Email: "library@futech.edu.ng", Role: "librarian", RoleLabel: "Librarian"}, Password: "demo1234"},
			{User: User{ID: "usr-clinic", Identifier: "FUT/STF/MED/0009", DisplayName: "Dr. Ahmed Bello", Email: "clinic@futech.edu.ng", Role: "clinic", RoleLabel: "Medical Officer"}, Password: "demo1234"},
			{User: User{ID: "usr-hostel", Identifier: "FUT/STF/SAF/0277", DisplayName: "Mr. Tunde Afolabi", Email: "hostel@futech.edu.ng", Role: "hostel", RoleLabel: "Hostel Officer"}, Password: "demo1234"},
			{User: User{ID: "usr-registry", Identifier: "FUT/STF/REG/0061", DisplayName: "Mrs. Patricia Okon", Email: "registry@futech.edu.ng", Role: "registry", RoleLabel: "Registry / Admissions"}, Password: "demo1234"},
			{User: User{ID: "usr-ict", Identifier: "FUT/STF/ICT/0015", DisplayName: "Engr. David Umeh", Email: "ict@futech.edu.ng", Role: "ict", RoleLabel: "ICT / Super Admin"}, Password: "demo1234"},
		},
		sessions: map[string]Session{},
	}
}

func (s *Service) Login(identifier, password string) (Session, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, candidate := range s.users {
		if candidate.Identifier == identifier && candidate.Password == password {
			token, err := newToken()
			if err != nil {
				return Session{}, err
			}
			session := Session{Token: token, User: candidate.User, CreatedAt: time.Now().UTC()}
			s.sessions[token] = session
			return session, nil
		}
	}
	return Session{}, ErrInvalidCredentials
}

func (s *Service) UserByToken(token string) (User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	session, ok := s.sessions[token]
	if !ok {
		return User{}, ErrInvalidToken
	}
	return session.User, nil
}

func (s *Service) Logout(token string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, token)
}

func newToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
