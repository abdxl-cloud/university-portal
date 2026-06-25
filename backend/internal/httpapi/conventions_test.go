package httpapi

import (
	"net/http/httptest"
	"strings"
	"testing"
)

type testBody struct {
	Name string `json:"name"`
}

func TestBindRejectsUnknownAndMultipleJSONValues(t *testing.T) {
	for _, body := range []string{`{"name":"ok","extra":true}`, `{"name":"one"} {"name":"two"}`} {
		req := httptest.NewRequest("POST", "/", strings.NewReader(body))
		rec := httptest.NewRecorder()
		var dst testBody
		if bind(rec, req, &dst) {
			t.Fatalf("accepted invalid body %s", body)
		}
		if rec.Code != 400 {
			t.Fatalf("status=%d", rec.Code)
		}
	}
}

func TestBindAcceptsSingleKnownObject(t *testing.T) {
	req := httptest.NewRequest("POST", "/", strings.NewReader(`{"name":"ok"}`))
	rec := httptest.NewRecorder()
	var dst testBody
	if !bind(rec, req, &dst) {
		t.Fatalf("rejected valid body: %s", rec.Body.String())
	}
	if dst.Name != "ok" {
		t.Fatalf("name=%q", dst.Name)
	}
}
