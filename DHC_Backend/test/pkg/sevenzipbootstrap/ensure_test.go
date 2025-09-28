package pkgTest

import (
	sevenZipBootStrap "DHC_Backend/pkg/sevenzipbootstrap"
	"testing"
)

func TestBuildTestURL(t *testing.T) {
	version := "25.01"
	testApi := sevenZipBootStrap.TestApi{}
	if result := testApi.BuildTestURL(version); result != "https://www.7-zip.org/a/7z2501-mac.tar.xz" {
		t.Errorf("result expected be https://www.7-zip.org/a/7z2501-mac.tar.xz, but %s got", result)
	}
}
