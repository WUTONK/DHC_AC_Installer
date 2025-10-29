package gameserver

import (
	"DHC_Backend/models/service/gameserver"
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
