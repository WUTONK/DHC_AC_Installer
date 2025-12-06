package infoGet

import (
	"fmt"
	"os/exec"
	"runtime"
	"strings"
)

// DiskType 磁盘类型
type DiskType int

const (
	DiskTypeUnknown DiskType = iota
	DiskTypeSSD
	DiskTypeHDD
)

// IsSSD 检测指定盘符是否为SSD
// 返回值：true=SSD, false=HDD, error=检测失败
func IsSSD(drive string) (bool, error) {
	if runtime.GOOS != "windows" {
		// 非Windows系统，暂时返回未知（可以根据需要实现Linux/Mac的检测逻辑）
		return false, fmt.Errorf("当前系统不支持SSD检测")
	}

	// Windows: 使用PowerShell查询WMI
	// 获取盘符对应的物理磁盘信息
	psCmd := fmt.Sprintf(`
		$drive = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='%s'"
		if ($drive) {
			$partitions = Get-WmiObject Win32_DiskDriveToDiskPartition | Where-Object {$_.Dependent -like "*$($drive.DeviceID)*"}
			if ($partitions) {
				$diskIndex = ($partitions | Select-Object -First 1).Antecedent -replace '.*Disk #(\d+).*', '$1'
				$disk = Get-WmiObject Win32_DiskDrive | Where-Object {$_.Index -eq [int]$diskIndex} | Select-Object -First 1
				if ($disk) {
					$mediaType = $disk.MediaType
					$model = $disk.Model
					if ($mediaType -eq "SSD" -or ($mediaType -eq "Fixed hard disk media" -and $model -like "*SSD*")) {
						Write-Output "SSD"
					} else {
						Write-Output "HDD"
					}
					exit 0
				}
			}
		}
		Write-Output "UNKNOWN"
	`, drive)

	cmd := exec.Command("powershell", "-Command", psCmd)
	output, err := cmd.Output()
	if err != nil {
		return false, fmt.Errorf("检测SSD失败: %w", err)
	}

	result := strings.TrimSpace(string(output))
	if result == "SSD" {
		return true, nil
	} else if result == "HDD" {
		return false, nil
	}

	return false, fmt.Errorf("无法确定磁盘类型: %s", result)
}

// IsRemovable 检测指定盘符是否为可拔插设备
// 返回值：true=可拔插设备, false=固定设备, error=检测失败
func IsRemovable(drive string) (bool, error) {
	if runtime.GOOS != "windows" {
		// 非Windows系统，暂时返回未知
		return false, fmt.Errorf("当前系统不支持可拔插设备检测")
	}

	// Windows: 使用PowerShell查询WMI
	psCmd := fmt.Sprintf(`
		$drive = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='%s'"
		if ($drive) {
			Write-Output $drive.DriveType
			exit 0
		}
		Write-Output "UNKNOWN"
	`, drive)

	cmd := exec.Command("powershell", "-Command", psCmd)
	output, err := cmd.Output()
	if err != nil {
		return false, fmt.Errorf("检测可拔插设备失败: %w", err)
	}

	result := strings.TrimSpace(string(output))
	// DriveType: 2=可移动设备, 3=固定硬盘, 4=网络驱动器, 5=CD-ROM
	if result == "2" {
		return true, nil
	} else if result == "3" {
		return false, nil
	}

	return false, fmt.Errorf("无法确定设备类型: %s", result)
}

// GetDiskInfo 获取磁盘信息（SSD/HDD和是否可拔插）
// 返回值：isSSD, isRemovable, error
func GetDiskInfo(drive string) (isSSD bool, isRemovable bool, err error) {
	// 检测是否为SSD（如果失败，默认为HDD）
	isSSD, err = IsSSD(drive)
	if err != nil {
		// 如果检测失败，默认为HDD（保守策略）
		isSSD = false
	}

	// 检测是否为可拔插设备
	isRemovable, err = IsRemovable(drive)
	if err != nil {
		// 如果检测失败，默认为固定设备（保守策略）
		isRemovable = false
	}

	return isSSD, isRemovable, nil
}
