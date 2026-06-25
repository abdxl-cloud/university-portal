package config

import "testing"

func TestProductionConfigRejectsUnsafeDefaults(t *testing.T) {
	cfg := Config{Env: "production", DatabaseURL: "postgres://formbuilder:formbuilder@db/formbuilder", IdentitySecret: "dev-identity-secret-change-me"}
	if err := cfg.Validate(); err == nil {
		t.Fatal("unsafe production config was accepted")
	}
}

func TestProductionConfigRejectsEncodedDefaultPassword(t *testing.T) {
	cfg := Config{Env: "production", DatabaseURL: "postgres://formbuilder:form%62uilder@db/formbuilder", IdentitySecret: "01234567890123456789012345678901"}
	if err := cfg.Validate(); err == nil {
		t.Fatal("encoded default password was accepted")
	}
}

func TestProductionConfigAcceptsExplicitSecrets(t *testing.T) {
	cfg := Config{Env: "production", DatabaseURL: "postgres://formbuilder:a-unique-password@db/formbuilder", IdentitySecret: "01234567890123456789012345678901"}
	if err := cfg.Validate(); err != nil {
		t.Fatalf("safe config rejected: %v", err)
	}
}
