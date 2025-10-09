package pkgTest

import (
	EnsureSevenZipSimple "DHC_Backend/pkg/sevenzipbootstrap_simple"
	"testing"
)

func Test_GetTargetVersion(t *testing.T) {
	testApi := EnsureSevenZipSimple.TestApi{}

	wantTargetVersion := "25.01"

	result := testApi.GetTargetVersion()

	if result != wantTargetVersion {
		t.Errorf("期望得到版本%s,但得到%s", wantTargetVersion, result)
	}
}
