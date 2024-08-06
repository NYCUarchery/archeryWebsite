package database

import (
	. "backend/internal/database"
	"fmt"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/suite"
)

type PlayerTestSuite struct {
	suite.Suite
}

func (suite *PlayerTestSuite) SetupSuite() {
	SetupDatabaseByMode("test")
}

func (suite *PlayerTestSuite) TearDownSuite() {

}

func (suite *PlayerTestSuite) SetupTest() {
	TestDBRestore()
}

func (suite *PlayerTestSuite) TearDownTest() {

}

func TestPlayerTestSuite(t *testing.T) {
	suite.Run(t, new(PlayerTestSuite))
}

func TestInitPlayer(t *testing.T) {
	DropTables()
	Convey("Test InitPlayer", t, func() {
		/*precondition*/
		InitUser()
		InitInstitution()
		InitParticipant()
		/*end of precondition*/
		Convey("before InitPlayer, the table should not exist", func() {
			So(DB.Migrator().HasTable(&Player{}), ShouldBeFalse)
			So(DB.Migrator().HasTable(&Round{}), ShouldBeFalse)
			So(DB.Migrator().HasTable(&RoundEnd{}), ShouldBeFalse)
			So(DB.Migrator().HasTable(&RoundScore{}), ShouldBeFalse)
		})
		InitPlayer()
		Convey("after InitPlayer, the table should exist", func() {
			So(DB.Migrator().HasTable(&Player{}), ShouldBeTrue)
			So(DB.Migrator().HasTable(&Round{}), ShouldBeTrue)
			So(DB.Migrator().HasTable(&RoundEnd{}), ShouldBeTrue)
			So(DB.Migrator().HasTable(&RoundScore{}), ShouldBeTrue)
		})
	})
}

func (suite *PlayerTestSuite) TestGetPlayerIsExist() {
	Convey("Test GetPlayerIsExist", suite.T(), func() {
		Convey("When the player exists, the result should be true", func() {
			ID := uint(1)
			result := GetPlayerIsExist(ID)
			So(result, ShouldBeTrue)
		})
		Convey("When the player does not exist, the result should be false", func() {
			ID := uint(2000)
			result := GetPlayerIsExist(ID)
			So(result, ShouldBeFalse)
		})
	})
}

func (suite *PlayerTestSuite) TestGetRoundIsExist() {
	Convey("Test GetRoundIsExist", suite.T(), func() {
		Convey("When the round exists, the result should be true", func() {
			ID := uint(1)
			result := GetRoundIsExist(ID)
			So(result, ShouldBeTrue)
		})
		Convey("When the round does not exist, the result should be false", func() {
			ID := uint(2000)
			result := GetRoundIsExist(ID)
			So(result, ShouldBeFalse)
		})
	})
}

func (suite *PlayerTestSuite) TestGetRoundEndIsExist() {
	Convey("Test GetRoundEndIsExist", suite.T(), func() {
		Convey("When the round end exists, the result should be true", func() {
			ID := uint(1)
			result := GetRoundEndIsExist(ID)
			So(result, ShouldBeTrue)
		})
		Convey("When the round end does not exist, the result should be false", func() {
			ID := uint(2000)
			result := GetRoundEndIsExist(ID)
			So(result, ShouldBeFalse)
		})
	})
}

func (suite *PlayerTestSuite) TestGetRoundScoreIsExist() {
	Convey("Test GetRoundScoreIsExist", suite.T(), func() {
		Convey("When the round score exists, the result should be true", func() {
			ID := uint(1)
			result := GetRoundScoreIsExist(ID)
			So(result, ShouldBeTrue)
		})
		Convey("When the round score does not exist, the result should be false", func() {
			ID := uint(2000)
			result := GetRoundScoreIsExist(ID)
			So(result, ShouldBeFalse)
		})
	})
}

//GetOnlyPlayer
//GetDummyPlayersByParticipantId
//GetPlayerWScores

func (suite *PlayerTestSuite) TestGetPlayerScoreByRoundScoreId() {
	Convey("Test GetPlayerScoreByRoundScoreId", suite.T(), func() {
		Convey("When the round score exists", func() {
			testcases := []struct {
				ID            uint
				expectedScore int
			}{
				{1, -1},
				{864, -1},
				{865, 10},
				{866, 9},
				{867, 8},
				{922, 11},
			}
			for _, tc := range testcases {
				score, err := GetPlayerScoreByRoundScoreId(tc.ID)
				So(score, ShouldEqual, tc.expectedScore)
				So(err, ShouldBeNil)
			}
		})
		Convey("When the round score does not exist", func() {
			testCases := []uint{0, 2000}
			for _, tc := range testCases {
				score, err := GetPlayerScoreByRoundScoreId(tc)
				So(score, ShouldEqual, 0)
				So(err, ShouldNotBeNil)
			}
		})
	})
}

func (suite *PlayerTestSuite) TestGetPlayerTotalScoreByPlayerId() {
	Convey("Test GetPlayerTotalScoreByPlayerId", suite.T(), func() {
		testCases := []struct {
			playerID uint
			expected int
		}{
			{1, 0},
			{8, 0},
			{9, 769},
			{17, 924},
		}
		for _, tc := range testCases {
			score, err := GetPlayerTotalScoreByPlayerId(tc.playerID)
			So(score, ShouldEqual, tc.expected)
			So(err, ShouldBeNil)
		}
	})
	Convey("When the player does not exist", suite.T(), func() {
		testCases := []uint{0, 18, 2000}
		for _, tc := range testCases {
			score, err := GetPlayerTotalScoreByPlayerId(tc)
			So(score, ShouldEqual, 0)
			So(err, ShouldNotBeNil)
		}
	})
}

func (suite *PlayerTestSuite) TestGetPlayerRoundTotalScoreByRoundId() {
	Convey("Test GetPlayerRoundTotalScoreByRoundId", suite.T(), func() {
		testCases := []struct {
			roundID  uint
			expected int
		}{
			{1, 0},
			{24, 0},
			{25, 252},
			{51, 292},
		}
		for _, tc := range testCases {
			score, err := GetPlayerRoundTotalScoreByRoundId(tc.roundID)
			So(score, ShouldEqual, tc.expected)
			So(err, ShouldBeNil)
		}
	})
	Convey("When the round does not exist", suite.T(), func() {
		testCases := []uint{0, 52, 2000}
		for _, tc := range testCases {
			score, err := GetPlayerRoundTotalScoreByRoundId(tc)
			So(score, ShouldEqual, 0)
			So(err, ShouldNotBeNil)
		}
	})
}

// GetPlayerIdsByCompetitionIdGroupId

func (suite *PlayerTestSuite) TestGetRoundIdByRoundScoreId() {
	Convey("Test GetRoundIdByRoundScoreId", suite.T(), func() {
		Convey("When the round score id exists", func() {
			testcases := []struct {
				RoundScoreId uint
				expected     uint
			}{
				{1, 1},
				{864, 24},
				{865, 25},
				{866, 25},
				{1836, 51},
			}
			for _, tc := range testcases {
				roundID, err := GetRoundIdByRoundScoreId(tc.RoundScoreId)
				So(roundID, ShouldEqual, tc.expected)
				So(err, ShouldBeNil)
			}
		})
		Convey("When the round score does not exist", func() {
			testCases := []uint{0, 1837, 2000}
			for _, tc := range testCases {
				roundID, err := GetRoundIdByRoundScoreId(tc)
				So(roundID, ShouldEqual, 0)
				So(err, ShouldNotBeNil)
			}
		})
	})
}

// GetPlayerIdByRoundScoreId

// CreatePlayer
// CreateRound
// CreateRoundEnd
// CreateRoundScore

// UpdatePlayerGroupId
// UpdatePlayerLaneId
// UpdatePlayerOrder
// UpdatePlayerRank
// UpdatePlayerIsConfirmed

func (suite *PlayerTestSuite) TestUpdatePlayerScore() {
	Convey("Test UpdatePlayerScore", suite.T(), func() {
		Convey("When the roundScoreID exists", func() {
			Convey("When the expected score is changed", func() {
				testcases := []struct {
					roundScoreID  uint
					expectedScore int
				}{
					{1, 10}, {2, 9}, {3, 8}, {4, 7}, {5, 6},
					{6, 5}, {7, 4}, {8, 3}, {9, 2}, {10, 1},
					{11, 0}, {12, 11},
				}
				for _, tc := range testcases {
					err, isChanged := UpdatePlayerScore(tc.roundScoreID, tc.expectedScore)
					So(err, ShouldBeNil)
					So(isChanged, ShouldBeTrue)
					score, err := GetPlayerScoreByRoundScoreId(tc.roundScoreID)
					So(err, ShouldBeNil)
					So(score, ShouldEqual, tc.expectedScore)
				}
			})
			Convey("When the expected score is not changed", func() {
				err, isChanged := UpdatePlayerScore(13, -1)
				So(err, ShouldBeNil)
				So(isChanged, ShouldBeFalse)
				score, err := GetPlayerScoreByRoundScoreId(13)
				So(err, ShouldBeNil)
				So(score, ShouldEqual, -1)
			})
		})
		Convey("When the roundScoreID does not exist", func() {
			testCases := []uint{0, 2000}
			for _, tc := range testCases {
				Convey(fmt.Sprintf("out of boundary id: %d", tc), func() {
					err, isChanged := UpdatePlayerScore(tc, 10)
					So(err, ShouldBeNil)
					So(isChanged, ShouldBeFalse)
					score, err := GetPlayerScoreByRoundScoreId(tc)
					So(score, ShouldEqual, 0)
					So(err, ShouldNotBeNil)
				})
			}
		})
		Convey("When db error occurs", func() {
			DropTables()
			testCases := []uint{0, 1, 100, 2000}
			for _, tc := range testCases {
				Convey(fmt.Sprintf("any id(%d) should get error", tc), func() {
					err, isChanged := UpdatePlayerScore(tc, 10)
					So(err, ShouldNotBeNil)
					So(isChanged, ShouldBeFalse)
					score, err := GetPlayerScoreByRoundScoreId(tc)
					So(score, ShouldEqual, 0)
					So(err, ShouldNotBeNil)
				})
			}
		})
	})
}

// UpdatePlayerShootoffScore
func (suite *PlayerTestSuite) TestUpdatePlayerTotalScore() {
	Convey("Test UpdatePlayerTotalScore", suite.T(), func() {
		Convey("When the player exists", func() {
			Convey("When the expected total score is changed", func() {
				testcases := []struct {
					playerID      uint
					expectedScore int
				}{
					{1, 1000}, {2, 10}, {17, 1000},
				}
				for _, tc := range testcases {
					err, isChanged := UpdatePlayerTotalScore(tc.playerID, tc.expectedScore)
					So(err, ShouldBeNil)
					So(isChanged, ShouldBeTrue)
					score, err := GetPlayerTotalScoreByPlayerId(tc.playerID)
					So(err, ShouldBeNil)
					So(score, ShouldEqual, tc.expectedScore)
				}
			})
			Convey("When the expected total score is not changed", func() {
				err, isChanged := UpdatePlayerTotalScore(3, 0)
				So(err, ShouldBeNil)
				So(isChanged, ShouldBeFalse)
				score, err := GetPlayerTotalScoreByPlayerId(3)
				So(err, ShouldBeNil)
				So(score, ShouldEqual, 0)
			})
		})
		Convey("When the player does not exist", func() {
			testCases := []uint{0, 18, 2000}
			for _, tc := range testCases {
				Convey(fmt.Sprintf("out of boundary id: %d", tc), func() {
					err, isChanged := UpdatePlayerTotalScore(tc, 10)
					So(err, ShouldBeNil)
					So(isChanged, ShouldBeFalse)
					score, err := GetPlayerTotalScoreByPlayerId(tc)
					So(score, ShouldEqual, 0)
					So(err, ShouldNotBeNil)
				})
			}
		})
		Convey("When db error occurs", func() {
			DropTables()
			testCases := []uint{0, 1, 100, 2000}
			for _, tc := range testCases {
				Convey(fmt.Sprintf("any id(%d) should get error", tc), func() {
					err, isChanged := UpdatePlayerTotalScore(tc, 10)
					So(err, ShouldNotBeNil)
					So(isChanged, ShouldBeFalse)
					score, err := GetPlayerTotalScoreByPlayerId(tc)
					So(score, ShouldEqual, 0)
					So(err, ShouldNotBeNil)
				})
			}
		})
	})
}

func (suite *PlayerTestSuite) TestUpdatePlayerRoundTotalScore() {
	Convey("Test UpdatePlayerRoundTotalScore", suite.T(), func() {
		Convey("When the round exists", func() {
			Convey("When the expected total score is changed", func() {
				testcases := []struct {
					roundID       uint
					expectedScore int
				}{
					{1, 1000}, {2, 10}, {51, 300},
				}
				for _, tc := range testcases {
					err, isChanged := UpdatePlayerRoundTotalScore(tc.roundID, tc.expectedScore)
					So(err, ShouldBeNil)
					So(isChanged, ShouldBeTrue)
					score, err := GetPlayerRoundTotalScoreByRoundId(tc.roundID)
					So(err, ShouldBeNil)
					So(score, ShouldEqual, tc.expectedScore)
				}
			})
			Convey("When the expected total score is not changed", func() {
				err, isChanged := UpdatePlayerRoundTotalScore(3, 0)
				So(err, ShouldBeNil)
				So(isChanged, ShouldBeFalse)
				score, err := GetPlayerRoundTotalScoreByRoundId(3)
				So(err, ShouldBeNil)
				So(score, ShouldEqual, 0)
			})
		})
		Convey("When the round does not exist", func() {
			testCases := []uint{0, 52, 2000}
			for _, tc := range testCases {
				Convey(fmt.Sprintf("out of boundary id: %d", tc), func() {
					err, isChanged := UpdatePlayerRoundTotalScore(tc, 10)
					So(err, ShouldBeNil)
					So(isChanged, ShouldBeFalse)
					score, err := GetPlayerRoundTotalScoreByRoundId(tc)
					So(score, ShouldEqual, 0)
					So(err, ShouldNotBeNil)
				})
			}
		})
		Convey("When db error occurs", func() {
			DropTables()
			testCases := []uint{0, 1, 100, 2000}
			for _, tc := range testCases {
				Convey(fmt.Sprintf("any id(%d) should get error", tc), func() {
					err, isChanged := UpdatePlayerRoundTotalScore(tc, 10)
					So(err, ShouldNotBeNil)
					So(isChanged, ShouldBeFalse)
					score, err := GetPlayerRoundTotalScoreByRoundId(tc)
					So(score, ShouldEqual, 0)
					So(err, ShouldNotBeNil)
				})
			}
		})
	})
}

// DeletePlayer
