package infoget

import (
	"DHC_Backend/models/service/infoGet"
	"testing"
)

func TestGetDiskUsage(t *testing.T) {
	path := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test"
	infoGet.GetDiskUsage(path)
}
