package decompression

import (
	decompression "DHC_Backend/models/service/decompression"
	"fmt"
	"testing"
)

func TestGet7zPath(t *testing.T) {
	decompression.Get7zPath(true)
}

func TestSzTest(t *testing.T) {
	decompression.SzTest()
}

func TestDhcFileTagIdentify(t *testing.T) {
	DhcFileTagPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/unitTest/models/service/decompression"
	result, err := decompression.DhcFileTagIdentify(DhcFileTagPath)
	if err != nil {
		t.Errorf("DhcFileTagIdentify failed: %v", err)
		return
	}
	fmt.Printf("%+v\n", result)
}
