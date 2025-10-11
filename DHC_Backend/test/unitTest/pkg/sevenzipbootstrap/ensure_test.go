package pkgTest

import (
	sevenZipBootStrap "DHC_Backend/pkg/sevenzipbootstrap"
	"testing"
)

func TestBuildTestURL(t *testing.T) {
	testApi := sevenZipBootStrap.TestApi{}
	version := "25.01"
	if result := testApi.BuildTestURL(version); result != "https://www.7-zip.org/a/7z2501-mac.tar.xz" {
		t.Errorf("result expected be https://www.7-zip.org/a/7z2501-mac.tar.xz, but %s got", result)
	}

	// 测试其他版本
	testCases := []struct {
		version  string
		expected string
	}{
		{"23.01", "https://www.7-zip.org/a/7z2301-mac.tar.xz"},
		{"22.01", "https://www.7-zip.org/a/7z2201-mac.tar.xz"},
		{"21.07", "https://www.7-zip.org/a/7z2107-mac.tar.xz"},
	}

	for _, tc := range testCases {
		result := testApi.BuildTestURL(tc.version)
		if result != tc.expected {
			t.Errorf("版本 %s: 期望 %s, 实际得到 %s", tc.version, tc.expected, result)
		}
	}
}

func TestExtractVersion(t *testing.T) {
	testApi := sevenZipBootStrap.TestApi{}
	testCases := []struct {
		input    string
		expected string
	}{
		{"7-Zip 23.01 (x64) : Copyright (c) 1999-2023 Igor Pavlov : 2023-06-20", "23.01"},
		{"7-Zip 25.01 (x64) : Copyright (c) 1999-2025 Igor Pavlov : 2025-01-01", "25.01"},
		{"7-Zip 22.01 (x64)", "22.01"},
		{"No version here", ""},
		{"", ""},
	}

	for _, tc := range testCases {
		result := testApi.ExtractVersion(tc.input)
		if result != tc.expected {
			t.Errorf("输入 '%s': 期望 '%s', 实际得到 '%s'", tc.input, tc.expected, result)
		}
	}
}

func TestCompareVersion(t *testing.T) {
	testCases := []struct {
		v1       string
		v2       string
		expected int
	}{
		{"23.01", "22.01", 1},  // v1 > v2
		{"22.01", "23.01", -1}, // v1 < v2
		{"23.01", "23.01", 0},  // v1 == v2
		{"25.01", "23.01", 1},  // v1 > v2
		{"23.01", "25.01", -1}, // v1 < v2
	}

	for _, tc := range testCases {
		testApi := sevenZipBootStrap.TestApi{}
		result := testApi.CompareVersion(tc.v1, tc.v2)
		if result != tc.expected {
			t.Errorf("比较 %s 和 %s: 期望 %d, 实际得到 %d", tc.v1, tc.v2, tc.expected, result)
		}
	}
}
