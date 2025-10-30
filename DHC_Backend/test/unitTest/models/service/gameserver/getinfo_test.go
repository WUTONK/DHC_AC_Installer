package gameserver

import (
	"DHC_Backend/models/service/gameserver"
	"encoding/json"
	"fmt"
	"testing"
	"time"
)

func TestGetPing(t *testing.T) {
	result, err := gameserver.GetPing("www.baidu.com", 1*time.Second)
	if err != nil {
		fmt.Printf("ping failed")
	}
	fmt.Printf("延迟:%v", result)
}

func TestGetServerInfo(t *testing.T) {
	info, err := gameserver.GetServerInfo("5.161.43.117:8081")
	if err != nil {
		panic(err)
	}

	data, _ := json.MarshalIndent(info, "", "  ")
	fmt.Printf("%s\n", data)
}
