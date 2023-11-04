package database

import "gorm.io/gorm"

type Qualification struct {
	ID              uint    `json:"id"        gorm:"primary_key"`
	AdvancingNum    int     `json:"advancing_num"`
	CurrentRound    int     `json:"current_round"`
	CurrentEnd      int     `json:"current_end"`
	StartLaneNumber int     `json:"start_lane"`
	EndLaneNumber   int     `json:"end_lane"`
	Lanes           []*Lane `json:"lanes" `
}

func InitQualification() {
	DB.AutoMigrate(&Qualification{})
}

func GetQualificationIsExist(id uint) bool {
	var data Qualification
	DB.Model(&Qualification{}).Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetOnlyQualification(ID uint) (Qualification, error) {
	var data Qualification
	result := DB.Model(&Qualification{}).Where("id = ?", ID).First(&data)
	return data, result.Error
}

func GetQualificationWLanesByID(id uint) (Qualification, error) {
	var data Qualification
	result := DB.Model(&Qualification{}).
		Preload("Lanes", func(*gorm.DB) *gorm.DB {
			return DB.Order("lane_number asc")
		}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetQualificationWLanesPlayersByID(id uint) (Qualification, error) {
	var data Qualification
	result := DB.
		Preload("Lanes", func(*gorm.DB) *gorm.DB {
			return DB.Order("id asc").
				Preload("Players", func(*gorm.DB) *gorm.DB { return DB.Order("order_number asc") })
		}).
		Model(&Qualification{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func PostQualification(data Qualification) (Qualification, error) {
	result := DB.Model(&Qualification{}).Create(&data)
	return data, result.Error
}

func UpdateQualification(id uint, data Qualification) (bool, error) {
	result := DB.Model(&Qualification{}).Where("id = ?", id).Updates(&data)
	return true, result.Error
}

func DeleteQualification(id uint) (bool, error) {
	result := DB.Delete(&Qualification{}, "id =?", id)
	return true, result.Error
}
