package database

import (
	. "backend/internal/database"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/suite"
)

type EliminationProgressTestSuite struct {
	suite.Suite
}

func (suite *EliminationProgressTestSuite) SetupSuite() {
	SetupDatabaseByMode("test")
}

func (suite *EliminationProgressTestSuite) SetupTest() {
	TestDBRestore()
}

func TestEliminationProgressTestSuite(t *testing.T) {
	suite.Run(t, new(EliminationProgressTestSuite))
}

func (suite *EliminationProgressTestSuite) TestUpdateEliminationProgressUpdatesBothColumns() {
	Convey("progress update changes stage and end together", suite.T(), func() {
		elimination, err := CreateElimination(Elimination{GroupId: 2, TeamSize: 1})
		So(err, ShouldBeNil)

		firstStage, err := CreateStage(Stage{EliminationId: elimination.ID})
		So(err, ShouldBeNil)
		_, err = CreateMatch(Match{StageId: firstStage.ID})
		So(err, ShouldBeNil)

		secondStage, err := CreateStage(Stage{EliminationId: elimination.ID})
		So(err, ShouldBeNil)
		_, err = CreateMatch(Match{StageId: secondStage.ID})
		So(err, ShouldBeNil)

		err = UpdateEliminationProgress(elimination.ID, 1, 4)
		So(err, ShouldBeNil)

		updated, err := GetOnlyEliminationById(elimination.ID)
		So(err, ShouldBeNil)
		So(updated.CurrentStage, ShouldEqual, 1)
		So(updated.CurrentEnd, ShouldEqual, 4)
	})
}

func (suite *EliminationProgressTestSuite) TestStageAndMatchPreloadsAreOrderedByID() {
	Convey("stages and matches use ascending id order", suite.T(), func() {
		elimination, err := CreateElimination(Elimination{GroupId: 2, TeamSize: 1})
		So(err, ShouldBeNil)

		firstStage, err := CreateStage(Stage{EliminationId: elimination.ID})
		So(err, ShouldBeNil)
		secondStage, err := CreateStage(Stage{EliminationId: elimination.ID})
		So(err, ShouldBeNil)
		firstMatch, err := CreateMatch(Match{StageId: firstStage.ID})
		So(err, ShouldBeNil)
		secondMatch, err := CreateMatch(Match{StageId: firstStage.ID})
		So(err, ShouldBeNil)
		_, err = CreateMatch(Match{StageId: secondStage.ID})
		So(err, ShouldBeNil)
		matchResult, err := CreateMatchResult(MatchResult{MatchId: firstMatch.ID})
		So(err, ShouldBeNil)
		firstEnd, err := CreateMatchEnd(MatchEnd{MatchResultId: matchResult.ID})
		So(err, ShouldBeNil)
		secondEnd, err := CreateMatchEnd(MatchEnd{MatchResultId: matchResult.ID})
		So(err, ShouldBeNil)

		loaded, err := GetEliminationWStagesMatchesById(elimination.ID)
		So(err, ShouldBeNil)
		So(loaded.Stages, ShouldHaveLength, 2)
		So(loaded.Stages[0].ID, ShouldEqual, firstStage.ID)
		So(loaded.Stages[1].ID, ShouldEqual, secondStage.ID)
		So(loaded.Stages[0].Matchs, ShouldHaveLength, 2)
		So(loaded.Stages[0].Matchs[0].ID, ShouldEqual, firstMatch.ID)
		So(loaded.Stages[0].Matchs[1].ID, ShouldEqual, secondMatch.ID)

		loadedWithScores, err := GetEliminationWScoresById(elimination.ID)
		So(err, ShouldBeNil)
		loadedEnds := loadedWithScores.Stages[0].Matchs[0].MatchResults[0].MatchEnds
		So(loadedEnds, ShouldHaveLength, 2)
		So(loadedEnds[0].ID, ShouldEqual, firstEnd.ID)
		So(loadedEnds[1].ID, ShouldEqual, secondEnd.ID)
	})
}
