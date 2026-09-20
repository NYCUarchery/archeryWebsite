//go:build integration

package database

import (
	"backend/internal/config"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	pkg "backend/internal/pkg"

	"github.com/stretchr/testify/require"
)

func integrationApp(t *testing.T) config.App {
	t.Helper()
	app, err := config.Load("")
	require.NoError(t, err)
	require.NoError(t, app.ValidateServer())
	return app
}

func TestDatabaseInitialPreservesExistingDictator(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	workingDirectory, err := os.Getwd()
	require.NoError(t, err)
	backendRoot := filepath.Clean(filepath.Join(workingDirectory, "../.."))
	require.NoError(t, os.Chdir(backendRoot))
	t.Cleanup(func() { require.NoError(t, os.Chdir(workingDirectory)) })

	require.NoError(t, ResetTestDatabase("empty"))
	require.NoError(t, DatabaseInitial(integrationApp(t)))

	var dictator User
	for _, user := range FindAllUsers() {
		if user.Role == pkg.RoleToString(pkg.RDictator) {
			dictator = user
			break
		}
	}
	require.NotZero(t, dictator.ID, "initial startup must create the configured Dictator")

	const changedPassword = "dictator-restart-password"
	dictator.RealName = "persisted Dictator profile"
	dictator.Email = "persisted-dictator@example.test"
	dictator.Overview = "persisted overview"
	dictator.Password = pkg.EncryptPassword(changedPassword)
	_, err = UpdataUser(dictator.ID, dictator)
	require.NoError(t, err)

	for run := 1; run <= 2; run++ {
		t.Run("restart", func(t *testing.T) {
			require.NoError(t, DatabaseInitial(integrationApp(t)))
			persisted, findErr := FindByUserID(dictator.ID)
			require.NoError(t, findErr)
			require.Equal(t, dictator.Role, persisted.Role)
			require.Equal(t, dictator.UserName, persisted.UserName)
			require.Equal(t, dictator.RealName, persisted.RealName)
			require.Equal(t, dictator.Email, persisted.Email)
			require.Equal(t, dictator.Overview, persisted.Overview)
			require.NoError(t, pkg.Compare(persisted.Password, changedPassword))
		})
	}
}

func TestDatabaseInitialRejectsNonDictatorUsernameCollision(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	workingDirectory, err := os.Getwd()
	require.NoError(t, err)
	backendRoot := filepath.Clean(filepath.Join(workingDirectory, "../.."))
	require.NoError(t, os.Chdir(backendRoot))
	t.Cleanup(func() { require.NoError(t, os.Chdir(workingDirectory)) })

	require.NoError(t, ResetTestDatabase("empty"))
	require.NoError(t, DatabaseInitial(integrationApp(t)))
	var configured User
	for _, user := range FindAllUsers() {
		if user.Role == pkg.RoleToString(pkg.RDictator) {
			configured = user
			break
		}
	}
	require.NotZero(t, configured.ID)
	configured.Role = pkg.RoleToString(pkg.RUser)
	configured.RealName = "must not be promoted"
	configured.Email = "non-dictator-collision@example.test"
	configured.Overview = "must not be changed"
	_, err = UpdataUser(configured.ID, configured)
	require.NoError(t, err)

	command := exec.Command(os.Args[0], "-test.run=^TestDatabaseInitialCollisionHelper$")
	command.Env = append(os.Environ(), "ARCHERY_DICTATOR_COLLISION_HELPER=1")
	output, runErr := command.CombinedOutput()
	var exitError *exec.ExitError
	require.ErrorAs(t, runErr, &exitError, string(output))
	require.Equal(t, 1, exitError.ExitCode(), string(output))
	require.Contains(t, string(output), "Dictator username is occupied by a non-Dictator user; refusing to modify it")

	persisted, findErr := FindByUserID(configured.ID)
	require.NoError(t, findErr)
	require.Equal(t, configured.Role, persisted.Role)
	require.Equal(t, configured.UserName, persisted.UserName)
	require.Equal(t, configured.RealName, persisted.RealName)
	require.Equal(t, configured.Email, persisted.Email)
	require.Equal(t, configured.Overview, persisted.Overview)
	require.Equal(t, configured.Password, persisted.Password)
}

func TestDatabaseInitialCollisionHelper(t *testing.T) {
	if os.Getenv("ARCHERY_DICTATOR_COLLISION_HELPER") != "1" {
		return
	}
	if err := DatabaseInitial(integrationApp(t)); err != nil {
		os.Stderr.WriteString(err.Error())
		os.Exit(1)
	}
	os.Exit(0)
}
